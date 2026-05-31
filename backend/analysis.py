import pandas as pd

def analyze_sales(region=None):

    df = pd.read_csv("../superstore_sales.csv", encoding="latin1")

    df['Order Date'] = pd.to_datetime(df['Order Date'], format='mixed', errors='coerce')

    if region and region != "All":
        df = df[df["Region"] == region]

    total_sales = df['Sales'].sum()
    total_profit = df['Profit'].sum()
    total_orders = len(df)

    monthly_sales = df.groupby(df['Order Date'].dt.to_period('M'))['Sales'].sum().sort_index()

    months = monthly_sales.index.to_timestamp().strftime('%b').tolist()

    region_sales = df.groupby("Region")["Sales"].sum().sort_values(ascending=False)

    category_sales = df.groupby("Category")["Sales"].sum()

    profit_data = df["Profit"].tolist()

    return (
        months,
        monthly_sales.tolist(),
        total_sales,
        total_profit,
        total_orders,
        region_sales.to_dict(),
        category_sales.to_dict(),
        profit_data
    )