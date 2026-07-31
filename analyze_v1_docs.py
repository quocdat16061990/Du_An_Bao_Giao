import pandas as pd
import os

folder_path = r"d:\Du_An_Bao_Giao\docs\update-docs-v1"
files = os.listdir(folder_path)

with open(r"d:\Du_An_Bao_Giao\analyze_v1_output.txt", "w", encoding="utf-8") as f:
    for file in files:
        if file.endswith('.xlsx') and not file.startswith('~$'):
            file_path = os.path.join(folder_path, file)
            f.write(f"--- Analyzing: {file} ---\n")
            try:
                xl = pd.ExcelFile(file_path)
                f.write(f"Sheets: {xl.sheet_names}\n")
                for sheet in xl.sheet_names:
                    df = xl.parse(sheet, nrows=5)
                    f.write(f"  Sheet '{sheet}':\n")
                    f.write(f"    Columns: {list(df.columns)}\n")
            except Exception as e:
                f.write(f"Error reading {file}: {e}\n")
            f.write("\n")
