import pandas as pd
import os

file_path = r"d:\Du_An_Bao_Giao\docs\update-docs-v1\TRA_CUU_TURBO MASTER TỔNG HỢP 2 FILE.xlsx"
xl = pd.ExcelFile(file_path)

with open(r"d:\Du_An_Bao_Giao\analyze_turbo_master.txt", "w", encoding="utf-8") as f:
    for sheet in xl.sheet_names:
        df = xl.parse(sheet, nrows=5)
        f.write(f"--- Sheet '{sheet}':\n")
        f.write(df.to_string())
        f.write("\n\n")
