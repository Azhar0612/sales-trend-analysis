from flask import Flask, jsonify, request
import pandas as pd
import sqlite3
import os
from flask_cors import CORS
from qlearning import q_learning_prediction

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE = os.path.join(BASE_DIR, "sales.db")


def ensure_table():

    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sales (
        Order_ID TEXT,
        Order_Date TEXT,
        Ship_Date TEXT,
        Ship_Mode TEXT,
        Customer_ID TEXT,
        Customer_Name TEXT,
        Segment TEXT,
        Country TEXT,
        City TEXT,
        State TEXT,
        Postal_Code TEXT,
        Region TEXT,
        Product_ID TEXT,
        Category TEXT,
        Sub_Category TEXT,
        Product_Name TEXT,
        Sales REAL,
        Quantity INTEGER,
        Discount REAL,
        Profit REAL
    )
    """)

    conn.commit()
    conn.close()


def get_data():

    conn = sqlite3.connect(DATABASE)
    df = pd.read_sql_query("SELECT * FROM sales", conn)
    conn.close()

    return df


@app.route("/analyze", methods=["POST"])
def analyze():

    try:

        region = request.form.get("region", "All")

        if "file" in request.files:

            file = request.files["file"]

            # 🔥 FIXED CSV READING
            df = pd.read_csv(file, encoding="latin1", sep=",", engine="python")

            df.columns = df.columns.str.replace(" ", "_")

            conn = sqlite3.connect(DATABASE)
            df.to_sql("sales", conn, if_exists="replace", index=False)
            conn.close()

        df = get_data()

        if df.empty:
            return jsonify({"error": "Database empty"}), 400

        df.columns = df.columns.str.replace(" ", "_")

        if region != "All":
            df = df[df["Region"] == region]

        total_sales = float(df["Sales"].sum())
        total_profit = float(df["Profit"].sum())
        total_orders = int(len(df))

        df["Order_Date"] = pd.to_datetime(df["Order_Date"], errors="coerce")

        df["Month"] = df["Order_Date"].dt.month

        monthly_sales = df.groupby("Month")["Sales"].sum()

        months = monthly_sales.index.tolist()
        sales_data = monthly_sales.values.tolist()

        category_sales = df.groupby("Category")["Sales"].sum().to_dict()
        region_sales = df.groupby("Region")["Sales"].sum().to_dict()

        profit_data = df["Profit"].tolist()

        prediction = q_learning_prediction(sales_data)

        return jsonify({
            "months": months,
            "sales_data": sales_data,
            "profit_data": profit_data,
            "total_sales": total_sales,
            "total_profit": total_profit,
            "total_orders": total_orders,
            "category_sales": category_sales,
            "region_sales": region_sales,
            "prediction": prediction
        })

    except Exception as e:

        print("❌ BACKEND ERROR:", e)

        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":

    ensure_table()

    print("Backend running at http://127.0.0.1:5000")

    app.run(debug=True)