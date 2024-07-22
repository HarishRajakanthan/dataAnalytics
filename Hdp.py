import yaml
import os
import subprocess
import pandas as pd
import streamlit as st
from concurrent.futures import ThreadPoolExecutor
from prophet import Prophet
from datetime import datetime

# Step 1: Read YAML file
def read_yaml(file_path):
    with open(file_path, 'r') as file:
        config = yaml.safe_load(file)
    return config

# Step 2: Run hadoop commands in parallel
def list_hadoop_paths(paths):
    def hadoop_ls(path):
        cmd = f"hadoop fs -ls {path}"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout

    with ThreadPoolExecutor() as executor:
        results = executor.map(hadoop_ls, paths)
    return list(results)

# Step 3: Sum sizes with shell command
def sum_sizes(output_files):
    sizes = []
    for file in output_files:
        with open(file, 'r') as f:
            for line in f:
                parts = line.split()
                if len(parts) > 4 and parts[0].isdigit():
                    size = int(parts[4])
                    date = parts[5]
                    sizes.append((date, size))
    return sizes

# Step 4: Load data into DataFrame and display in Streamlit
def create_dataframe(sizes):
    df = pd.DataFrame(sizes, columns=['date', 'size'])
    df['date'] = pd.to_datetime(df['date'])
    df = df.groupby('date')['size'].sum().reset_index()
    return df

# Step 5: Prophet for forecasting
def forecast_storage(df, quota):
    df.rename(columns={'date': 'ds', 'size': 'y'}, inplace=True)
    model = Prophet()
    model.fit(df)
    future = model.make_future_dataframe(periods=365)
    forecast = model.predict(future)

    forecast['color'] = 'green'
    forecast.loc[forecast['yhat'] > quota * 0.75, 'color'] = 'yellow'
    forecast.loc[forecast['yhat'] > quota * 0.90, 'color'] = 'red'

    return forecast

# Main function
def main():
    config = read_yaml('input.yaml')

    db_paths = sorted(config['db_path'])
    landing_paths = sorted(config['landing_path'])

    db_results = list_hadoop_paths(db_paths)
    landing_results = list_hadoop_paths(landing_paths)

    with open('db_output.txt', 'w') as f:
        f.write('\n'.join(db_results))

    with open('landing_output.txt', 'w') as f:
        f.write('\n'.join(landing_results))

    db_sizes = sum_sizes(['db_output.txt'])
    landing_sizes = sum_sizes(['landing_output.txt'])

    db_df = create_dataframe(db_sizes)
    landing_df = create_dataframe(landing_sizes)

    st.title('Hadoop Storage Monitoring and Forecasting')

    st.subheader('Overall Size vs Date')
    st.line_chart(db_df.set_index('date')['size'])

    st.subheader('Landing Size vs Date')
    st.line_chart(landing_df.set_index('date')['size'])

    tab1, tab2, tab3 = st.tabs(["Overview", "Tables", "Forecasting"])

    with tab1:
        st.write("Overall and landing size data.")

    with tab2:
        tables = config['db_path']
        selected_table = st.selectbox("Select a table", tables)
        selected_df = db_df[db_df['table'] == selected_table]
        st.line_chart(selected_df.set_index('date')['size'])

    with tab3:
        st.write("Storage Forecasting")
        quota = 1000000  # replace with actual quota
        forecast = forecast_storage(db_df, quota)
        st.line_chart(forecast.set_index('ds')[['yhat', 'color']])

if __name__ == '__main__':
    main()
