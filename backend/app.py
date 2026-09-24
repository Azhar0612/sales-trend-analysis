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
DEFAULT_CSV = os.path.join(BASE_DIR, "superstore_sales.csv")


def init_db_with_default_data():

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

    cursor.execute("SELECT COUNT(*) FROM sales")
    count = cursor.fetchone()[0]

    if count == 0 and os.path.exists(DEFAULT_CSV):
        try:
            df = pd.read_csv(DEFAULT_CSV, encoding="latin1", sep=",", engine="python")
            df.columns = df.columns.str.replace(" ", "_")
            df.to_sql("sales", conn, if_exists="replace", index=False)
            print("Successfully initialized database with superstore_sales.csv")
        except Exception as e:
            print("Failed to auto-populate database:", e)

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

        if "file" in request.files and request.files["file"].filename != "":

            file = request.files["file"]

            df = pd.read_csv(file, encoding="latin1", sep=",", engine="python")

            df.columns = df.columns.str.replace(" ", "_")

            conn = sqlite3.connect(DATABASE)
            df.to_sql("sales", conn, if_exists="replace", index=False)
            conn.close()

        df = get_data()

        if df.empty:
            return jsonify({"error": "Database is empty. Please upload a CSV dataset."}), 400

        df.columns = df.columns.str.replace(" ", "_")

        if region != "All":
            df = df[df["Region"] == region]

        if df.empty:
            return jsonify({"error": f"No data available for region '{region}'"}), 400

        total_sales = float(df["Sales"].sum())
        total_profit = float(df["Profit"].sum())
        total_orders = int(len(df))

        df["Order_Date"] = pd.to_datetime(df["Order_Date"], format="mixed", errors="coerce")
        df = df.dropna(subset=["Order_Date"])

        df["Month"] = df["Order_Date"].dt.month.astype(int)

        monthly_sales = df.groupby("Month")["Sales"].sum().sort_index()
        monthly_profit = df.groupby("Month")["Profit"].sum().sort_index()

        months = [int(m) for m in monthly_sales.index.tolist()]
        sales_data = [float(s) for s in monthly_sales.values.tolist()]
        profit_data = [float(p) for p in monthly_profit.values.tolist()]

        category_sales = {str(k): float(v) for k, v in df.groupby("Category")["Sales"].sum().to_dict().items()}
        region_sales = {str(k): float(v) for k, v in df.groupby("Region")["Sales"].sum().to_dict().items()}

        sub_cat_col = "Sub_Category" if "Sub_Category" in df.columns else "Sub-Category"
        if sub_cat_col in df.columns:
            sub_category_sales = {str(k): float(v) for k, v in df.groupby(sub_cat_col)["Sales"].sum().sort_values(ascending=False).head(10).to_dict().items()}
        else:
            sub_category_sales = {}

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
            "sub_category_sales": sub_category_sales,
            "prediction": prediction
        })

    except Exception as e:

        print("❌ BACKEND ERROR:", e)

        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":

    init_db_with_default_data()

    print("Backend running at http://127.0.0.1:5000")

    app.run(debug=True)