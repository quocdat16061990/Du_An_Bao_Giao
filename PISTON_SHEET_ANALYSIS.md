# BÁO CÁO CẤU TRÚC CỘT (SCHEMA) - 12 SHEET

Tài liệu này tổng hợp chi tiết cấu trúc cột (Schema) của toàn bộ 12 sheet trong tệp dữ liệu Excel `BAO GIA BO HOI - SEC MANG (DA DO GIA PISTON).xlsx` (đã được làm sạch emoji, icon và chuẩn hóa).

---

## 1. CẤU TRÚC CỘT - SHEET: `PISTON`
- **Tên trong Excel:** `PISTON`
- **Tổng số cột:** `21` Cột

| Ký hiệu | Tên Cột (Gốc) | Tên Cột (Làm sạch) | Mô tả & Ví dụ mẫu |
| :---: | :--- | :--- | :--- |
| **A** | Mã HH | **Mã HH** | Mã hàng hóa định danh piston. Ví dụ: `HH0600`, `HH082015` |
| **B** | Hãng | **Hãng** | Hãng xe tương thích. Ví dụ: `HINO`, `ISUZU`, `YANMAR` |
| **C** | Mã ĐC | **Mã ĐC** | Mã động cơ. Ví dụ: `DM100`, `EC100`, `N04CT` |
| **D** | ĐK | **ĐK** | Đường kính piston (mm). Ví dụ: `90`, `97`, `104` |
| **E** | Ký hiệu | **Ký hiệu** | Ký hiệu đặc tính. Ví dụ: `(A)`, `0 kiềng gang` |
| **F** | Buồng nổ | **Buồng nổ** | Cấu tạo đỉnh piston. Ví dụ: `Buồng Nổ hình đầu trâu...` |
| **G** | Ắc | **Ắc** | Chốt ắc piston (mm). Ví dụ: `29x77`, `31.5x81.5` |
| **H** | Ắc đỉnh | **Ắc đỉnh** | Chiều cao từ tâm ắc đến đỉnh (mm). Ví dụ: `38.5`, `42` |
| **I** | Tổng dài | **Tổng dài** | Chiều cao tổng quả piston (mm). Ví dụ: `104`, `112` |
| **J** | Ring 1-5 | **Ring 1-5** | Độ dày các lá xéc măng. Ví dụ: `2.5-2.5-2.5-4-4` |
| **K** | Thương hiệu | **Thương hiệu** | Thương hiệu sản xuất. Ví dụ: `IZUMI`, `IKAZU` |
| **L** | ĐVT | **ĐVT** | Đơn vị đóng gói. Ví dụ: `Bộ 6`, `Bộ 4` |
| **M** | Vốn | **Vốn** | Giá vốn nhập hàng. Ví dụ: *(Trống)* |
| **N** | VIP | **VIP** | Giá bán VIP (VND). Ví dụ: `2,100,000` |
| **O** | Ưu đãi | **Ưu đãi** | Giá bán ưu đãi (VND). Ví dụ: `2,250,000` |
| **P** | Đại lý | **Đại lý** | Giá bán đại lý (VND). Ví dụ: `2,400,000` |
| **Q** | Gara | **Gara** | Giá gara sửa chữa. Ví dụ: *(Trống)* |
| **R** | Tồn | **Tồn** | Tình trạng tồn kho. Ví dụ: `CÓ` |
| **S** | PARNO | **PARNO** | Part Number. Ví dụ: `13216-E0010` |
| **T** | Ghi chú | **Ghi chú** | Thông tin ghi chú bổ sung. Ví dụ: *(Trống)* |
| **U** | _KEY | **_KEY** | Khóa dữ liệu. Ví dụ: *(Trống)* |

---

## 2. CẤU TRÚC CỘT - SHEET: `SÉC MĂNG`
- **Tên trong Excel:** `SÉC MĂNG`
- **Tổng số cột:** `19` Cột

| Ký hiệu | Tên Cột (Gốc) | Tên Cột (Làm sạch) | Mô tả & Ví mẫu |
| :---: | :--- | :--- | :--- |
| **A** | Mã HH | **Mã HH** | Mã hàng xéc măng. Ví dụ: `HH071911`, `HH083979` |
| **B** | Hãng | **Hãng** | Hãng xe tương thích. Ví dụ: `HINO`, `ISUZU` |
| **C** | Mã ĐC | **Mã ĐC** | Mã động cơ + loại. Ví dụ: `DM100`, `EC100/có/lò/xo` |
| **D** | ĐK | **ĐK** | Đường kính (mm). Ví dụ: `90`, `97`, `104` |
| **E** | Xy lanh kiếng? | **Xy lanh kiếng?** | Hỗ trợ xy lanh kiếng. Ví dụ: *(Trống)* |
| **F** | Loại | **Loại** | Phân loại séc măng. Ví dụ: *(Trống)* |
| **G** | Ring | **Ring** | Độ dày các lá ring. Ví dụ: `2.5-2.5-2.5-4-4` |
| **H** | Thương hiệu | **Thương hiệu** | Hãng sản xuất. Ví dụ: `TP`, `HENWEIT`, `RIK` |
| **I** | ĐVT | **ĐVT** | Đơn vị đóng gói. Ví dụ: `Máy`, `1Máy` |
| **J** | Vốn | **Vốn** | Giá vốn. Ví dụ: *(Trống)* |
| **K** | VIP | **VIP** | Giá bán VIP (VND). Ví dụ: `120,000` |
| **L** | Ưu đãi | **Ưu đãi** | Giá bán ưu đãi (VND). Ví dụ: `130,000` |
| **M** | Đại lý | **Đại lý** | Giá đại lý (VND). Ví dụ: `140,000` |
| **N** | Gara | **Gara** | Giá gara. Ví dụ: *(Trống)* |
| **O** | Tồn | **Tồn** | Trạng thái tồn. Ví dụ: *(Trống)* |
| **P** | PARNO | **PARNO** | Part Number. Ví dụ: `SCH20004ZZ` |
| **Q** | Ghi chú | **Ghi chú** | Ghi chú. Ví dụ: *(Trống)* |
| **R** | _KEY | **_KEY** | Mô tả ghép tự động làm khóa. Ví dụ: `Séc măng DM100 - TP` |
| **S** | _AUTO | **_AUTO** | Cột kỹ thuật phụ. Ví dụ: *(Trống)* |

---

## 3. CẤU TRÚC CỘT - SHEET: `XY LANH`
- **Tên trong Excel:** `XY LANH`
- **Tổng số cột:** `17` Cột

| Ký hiệu | Tên Cột (Gốc) | Tên Cột (Làm sạch) | Mô tả & Ví dụ mẫu |
| :---: | :--- | :--- | :--- |
| **A** | Mã HH | **Mã HH** | Mã hàng hóa xy lanh. Ví dụ: `HH080200`, `HH0638` |
| **B** | Hãng | **Hãng** | Hãng xe. Ví dụ: `HINO`, `ISUZU` |
| **C** | Mã ĐC | **Mã ĐC** | Mã động cơ. Ví dụ: `DM100`, `EC100` |
| **D** | đường kính | **Đường kính** | Đường kính trong xy lanh (mm). Ví dụ: `90`, `97` |
| **E** | Số máy | **Số máy** | Số lượng xi lanh trên máy. Ví dụ: `6`, *(Trống)* |
| **F** | LOẠI | **Loại** | Cấu tạo xy lanh. Ví dụ: `xy lanh gang F/F` |
| **G** | PARNO | **PARNO** | Part Number. Ví dụ: `11467-1601` |
| **H** | Thương hiệu | **Thương hiệu** | Hãng sản xuất. Ví dụ: `IZ IKAZU`, `IZUMI` |
| **I** | ghi chú | **ĐVT / Ghi chú** | Đơn vị tính. Ví dụ: `Cái` |
| **J** | VIP | **VIP** | Giá VIP (VND). Ví dụ: `1,480,000` |
| **K** | Ưu đãi | **Ưu đãi** | Giá ưu đãi (VND). Ví dụ: `1,580,000` |
| **L** | Đại lý | **Đại lý** | Giá đại lý (VND). Ví dụ: `1,680,000` |
| **M** | Gara | **Gara** | Giá gara. Ví dụ: *(Trống)* |
| **N** | _TÊN | **_TÊN** | Tên sản phẩm đầy đủ ghép sẵn. Ví dụ: `Xy lanh Hino DM100 - IZ` |
| **O** | _KEY | **_KEY** | Khóa dữ liệu. Ví dụ: *(Trống)* |
| **P** | _AUTO | **_AUTO** | Cột kỹ thuật phụ. Ví dụ: *(Trống)* |
| **Q** | Gợi ý Mã HH | **Gợi ý Mã HH** | Gợi ý mã sản phẩm thay thế. Ví dụ: `HH070448, HH073131` |

---

## 4. CẤU TRÚC CỘT - SHEET: `THUN CÒ`
- **Tên trong Excel:** `THUN CÒ`
- **Tổng số cột:** `15` Cột

| Ký hiệu | Tên Cột (Gốc) | Tên Cột (Làm sạch) | Mô tả & Ví dụ mẫu |
| :---: | :--- | :--- | :--- |
| **A** | Mã HH | **Mã HH** | Mã hàng thun cò. Ví dụ: `HH082057`, `HH072453` |
| **B** | Hãng | **Hãng** | Hãng xe tương thích. Ví dụ: `HINO`, `ISUZU` |
| **C** | Mã ĐC | **Mã ĐC** | Mã động cơ hoặc mã liên kết. Ví dụ: `DM100/RT1001` |
| **D** | ĐK | **ĐK** | Đường kính (mm) / thông số. Ví dụ: `90`, `110`, `112` |
| **E** | Thương hiệu | **Thương hiệu** | Phân loại thun vị trí. Ví dụ: `New (thun DƯỚI) RT1017` |
| **F** | ĐVT | **ĐVT** | Đơn vị tính. Ví dụ: `Cái` |
| **G** | Vốn | **Vốn** | Giá vốn. Ví dụ: *(Trống)* |
| **H** | VIP | **VIP** | Giá VIP. Ví dụ: *(Trống)* |
| **I** | Ưu đãi | **Ưu đãi** | Giá ưu đãi. Ví dụ: *(Trống)* |
| **J** | Đại lý | **Đại lý** | Giá đại lý. Ví dụ: *(Trống)* |
| **K** | Gara | **Gara** | Giá gara. Ví dụ: *(Trống)* |
| **L** | Tồn | **Tồn** | Trạng thái tồn kho. Ví dụ: *(Trống)* |
| **M** | PARNO | **PARNO** | Part Number. Ví dụ: `RYT1004` |
| **N** | Ghi chú | **Ghi chú** | Ghi chú phụ trợ. Ví dụ: *(Trống)* |
| **O** | Tên đầy đủ | **Tên đầy đủ** | Tên mô tả đầy đủ ghép tự động. Ví dụ: `Thun ron nắp cò Hino DM100` |

---

## 5. CẤU TRÚC CỘT - SHEET: `PHỚT ĐẦU TRỤC CƠ`
- **Tên trong Excel:** `PHỚT ĐẦU TRỤC CƠ`
- **Tổng số cột:** `16` Cột

| Ký hiệu | Tên Cột (Gốc) | Tên Cột (Làm sạch) | Mô tả & Ví dụ mẫu |
| :---: | :--- | :--- | :--- |
| **A** | Mã HH | **Mã HH** | Mã hàng phớt đầu. Ví dụ: `HH074150`, `HH082540` |
| **B** | Hãng | **Hãng** | Hãng xe tương thích. Ví dụ: `HINO`, `ISUZU` |
| **C** | Mã ĐC | **Mã ĐC** | Mã động cơ. Ví dụ: `H07C/H06C/EH500/EH700` |
| **D** | ĐK | **ĐK** | Đường kính (mm) / thông số. Ví dụ: `110`, `112` |
| **E** | Kích thước | **Kích thước** | Kích thước kỹ thuật phớt. Ví dụ: `65-88-12/19`, `79-114-15` |
| **F** | Thương hiệu | **Thương hiệu** | Hãng sản xuất phớt. Ví dụ: `DF`, `DF/MSK` |
| **G** | ĐVT | **ĐVT** | Đơn vị tính. Ví dụ: `Cái`, `Bộ` |
| **H** | Vốn | **Vốn** | Giá vốn. Ví dụ: *(Trống)* |
| **I** | VIP | **VIP** | Giá VIP (VND). Ví dụ: `75,000`, *(Trống)* |
| **J** | Ưu đãi | **Ưu đãi** | Giá ưu đãi (VND). Ví dụ: `85,000`, *(Trống)* |
| **K** | Đại lý | **Đại lý** | Giá đại lý (VND). Ví dụ: `95,000`, *(Trống)* |
| **L** | Gara | **Gara** | Giá gara. Ví dụ: *(Trống)* |
| **M** | Tồn | **Tồn** | Trạng thái tồn kho. Ví dụ: *(Trống)* |
| **N** | PARNO | **PARNO** | Part Number. Ví dụ: `79-114-15` |
| **O** | Ghi chú | **Ghi chú** | Trạng thái hàng hóa. Ví dụ: `hết hàng` |
| **P** | Tên đầy đủ | **Tên đầy đủ** | Mô tả sản phẩm đầy đủ. Ví dụ: `Phớt đầu H07C/H06C (65-88-12/19) - DF` |

---

## 6. CẤU TRÚC CỘT - SHEET: `PHỚT ĐUÔI TRỤC CƠ`
- **Tên trong Excel:** `PHỚT ĐUÔI TRỤC CƠ`
- **Tổng số cột:** `16` Cột

| Ký hiệu | Tên Cột (Gốc) | Tên Cột (Làm sạch) | Mô tả & Ví dụ mẫu |
| :---: | :--- | :--- | :--- |
| **A** | Mã HH | **Mã HH** | Mã hàng phớt đuôi. Ví dụ: `HH074151`, `HH070946` |
| **B** | Hãng | **Hãng** | Hãng xe tương thích. Ví dụ: `HINO`, `ISUZU` |
| **C** | Mã ĐC | **Mã ĐC** | Mã động cơ. Ví dụ: `H07C/H06C`, `J05E/J08E` |
| **D** | ĐK | **ĐK** | Đường kính (mm) / thông số. Ví dụ: `110`, `112` |
| **E** | Kích thước | **Kích thước** | Kích thước kỹ thuật phớt. Ví dụ: `105-135-15`, `116*151*13/15` |
| **F** | Thương hiệu | **Thương hiệu** | Hãng sản xuất. Ví dụ: `DF`, `DF MASAKO`, `NICE/MSK` |
| **G** | ĐVT | **ĐVT** | Đơn vị tính. Ví dụ: `Cái` |
| **H** | Vốn | **Vốn** | Giá vốn. Ví dụ: *(Trống)* |
| **I** | VIP | **VIP** | Giá VIP (VND). Ví dụ: `70,000`, `130,000` |
| **J** | Ưu đãi | **Ưu đãi** | Giá ưu đãi (VND). Ví dụ: `80,000`, `150,000` |
| **K** | Đại lý | **Đại lý** | Giá đại lý (VND). Ví dụ: `90,000`, `170,000` |
| **L** | Gara | **Gara** | Giá gara. Ví dụ: *(Trống)* |
| **M** | Tồn | **Tồn** | Trạng thái tồn kho. Ví dụ: *(Trống)* |
| **N** | PARNO | **PARNO** | Part Number. Ví dụ: `105-135-15` |
| **O** | Ghi chú | **Ghi chú** | Ghi chú. Ví dụ: *(Trống)* |
| **P** | Tên đầy đủ | **Tên đầy đủ** | Mô tả đầy đủ. Ví dụ: `Phớt đuôi trục cơ H07C/H06C - DF` |

---

## 7. CẤU TRÚC CỘT - SHEET: `RON BỘ`
- **Tên trong Excel:** `RON BỘ`
- **Tổng số cột:** `14` Cột

| Ký hiệu | Tên Cột (Gốc) | Tên Cột (Làm sạch) | Mô tả & Ví dụ mẫu |
| :---: | :--- | :--- | :--- |
| **A** | STT | **STT** | Số thứ tự tăng dần. Ví dụ: `1`, `2`, `3` |
| **B** | MÃ VT | **Mã VT** | Mã vật tư / Mã hàng hóa định danh. Ví dụ: `HH076479`, `HH084235` |
| **C** | TÊN HÀNG | **Tên hàng** | Tên mô tả bộ ron + chất liệu. Ví dụ: `Ron bộ Hino DM100 - Amiang - MASAKO` |
| **D** | ĐK | **ĐK** | Đường kính (mm). Ví dụ: `90`, `97`, `108` |
| **E** | HÃNG | **Hãng** | Hãng xe tương thích. Ví dụ: `HINO`, `ISUZU` |
| **F** | TH SX | **Thương hiệu** | Hãng sản xuất. Ví dụ: `MASAKO`, `DF` |
| **G** | ĐVT | **ĐVT** | Đơn vị tính. Ví dụ: `Bộ` |
| **H** | GIÁ VỐN | **Giá vốn** | Giá vốn nhập hàng. Ví dụ: *(Trống)* |
| **I** | GIÁ VIP | **Giá VIP** | Giá VIP (VND). Ví dụ: `630,000`, `760,000` |
| **J** | GIÁ Ư.ĐÃI | **Giá Ưu đãi** | Giá ưu đãi (VND). Ví dụ: `670,000`, `810,000` |
| **K** | GIÁ ĐẠI LÝ | **Giá Đại lý** | Giá đại lý (VND). Ví dụ: `720,000`, `860,000` |
| **L** | GIÁ GARA | **Giá Gara** | Giá gara. Ví dụ: *(Trống)* |
| **M** | TỒN | **Tồn** | Trạng thái tồn. Ví dụ: *(Trống)* |
| **N** | GHI CHÚ | **Ghi chú** | Ghi chú kỹ thuật. Ví dụ: *(Trống)* |

---

## 8. CẤU TRÚC CỘT - SHEET: `RON MIẾNG`
- **Tên trong Excel:** `RON MIẾNG`
- **Tổng số cột:** `15` Cột

| Ký hiệu | Tên Cột (Gốc) | Tên Cột (Làm sạch) | Mô tả & Ví dụ mẫu |
| :---: | :--- | :--- | :--- |
| **A** | STT | **STT** | Số thứ tự tăng dần. Ví dụ: `1`, `2`, `3` |
| **B** | MÃ VT | **MÃ VT** | Mã hàng hóa. Ví dụ: `HH076259`, `HH070916` |
| **C** | TÊN HÀNG | **TÊN HÀNG** | Mô tả ron miếng + chất liệu. Ví dụ: `Ron miếng Hino DM100 - Amiang - MASAKO` |
| **D** | ĐK | **ĐK** | Đường kính (mm). Ví dụ: `90`, `97`, `124` |
| **E** | HÃNG | **HÃNG** | Hãng xe tương thích. Ví dụ: `HINO`, `ISUZU` |
| **F** | TH SX | **Thương hiệu** | Hãng sản xuất. Ví dụ: `MASAKO`, `NICE IN`, `DF` |
| **G** | ĐVT | **ĐVT** | Đơn vị tính. Ví dụ: `Cái`, `Bộ 2c` |
| **H** | GHI CHÚ | **GHI CHÚ** | Ghi chú. Ví dụ: *(Trống)* |
| **I** | GIÁ VỐN | **GIÁ VỐN** | Giá vốn. Ví dụ: *(Trống)* |
| **J** | GIÁ VIP | **GIÁ VIP** | Giá VIP (VND). Ví dụ: `140,000`, `250,000` |
| **K** | GIÁ Ư.ĐÃI | **GIÁ Ư.ĐÃI** | Giá ưu đãi (VND). Ví dụ: `150,000`, `270,000` |
| **L** | GIÁ ĐẠI LÝ | **GIÁ ĐẠI LÝ** | Giá đại lý (VND). Ví dụ: `200,000`, `290,000` |
| **M** | GIÁ GARA | **GIÁ GARA** | Giá gara. Ví dụ: *(Trống)* |
| **N** | TỒN | **TỒN** | Trạng thái tồn. Ví dụ: *(Trống)* |
| **O** | GHI CHÚ | **GHI CHÚ** | Ghi chú. Ví dụ: *(Trống)* |

---

## 9. CẤU TRÚC CỘT - SHEET: `MIỂNG TNC`
- **Tên trong Excel:** `MIỂNG TNC`
- **Tổng số cột:** `16` Cột

| Ký hiệu | Tên Cột (Gốc) | Tên Cột (Làm sạch) | Mô tả & Ví dụ mẫu |
| :---: | :--- | :--- | :--- |
| **A** | Mã HH | **Mã HH** | Mã hàng hóa định danh miểng. Ví dụ: `HH070779`, `HH071938` |
| **B** | Hãng | **Hãng** | Hãng xe tương thích. Ví dụ: `HINO`, `ISUZU` |
| **C** | Mã ĐC | **Mã ĐC** | Mã động cơ + loại cos. Ví dụ: `Bạc miểng DM100/DQ100 Cos0 - TAIHO` |
| **D** | ĐK | **ĐK** | Đường kính trong (mm). Ví dụ: `90` |
| **E** | Cos | **Cos** | Cấp cos (kích cỡ). Ví dụ: `Cos0`, `Cos1`, `Cos2` |
| **F** | Loại | **Loại** | Phân loại miểng dên/baze. Ví dụ: `Baze+Dên` |
| **G** | Thương hiệu | **Thương hiệu** | Hãng sản xuất. Ví dụ: `TAIHO` |
| **H** | ĐVT | **ĐVT** | Đơn vị tính. Ví dụ: `Bộ` |
| **I** | Ghi chú | **Ghi chú** | Ghi chú phụ trợ. Ví dụ: *(Trống)* |
| **J** | VIP | **VIP** | Giá VIP. Ví dụ: *(Trống)* |
| **K** | Ưu đãi | **Ưu đãi** | Giá ưu đãi. Ví dụ: *(Trống)* |
| **L** | Đại lý | **Đại lý** | Giá đại lý. Ví dụ: *(Trống)* |
| **M** | Gara | **Gara** | Giá gara. Ví dụ: *(Trống)* |
| **N** | Tồn | **Tồn** | Trạng thái tồn kho. Ví dụ: *(Trống)* |
| **O** | PARNO | **PARNO** | Part Number. Ví dụ: *(Trống)* |
| **P** | Tên đầy đủ | **Tên đầy đủ** | Tên đầy đủ tự động ghép. Ví dụ: `Bạc miểng DM100/DQ100 Cos0 - TAIHO` |

---

## 10. CẤU TRÚC CỘT - SHEET: `MIỂNG TRA CỨU`
- **Tên trong Excel:** `MIỂNG TRA CỨU`
- **Tổng số cột:** `19` Cột

| Ký hiệu | Tên Cột (Gốc) | Tên Cột (Làm sạch) | Mô tả & Ví dụ mẫu |
| :---: | :--- | :--- | :--- |
| **A** | Hãng | **Hãng** | Hãng xe tương thích. Ví dụ: `CATERPILLAR`, `TOYOTA` |
| **B** | Mã ĐC | **Mã ĐC** | Mã động cơ tương thích. Ví dụ: `1140/1145/1150/1160/3145/3150` |
| **C** | ĐK | **ĐK** | Đường kính (mm). Ví dụ: *(Trống)* |
| **D** | Loại | **Loại** | Phân loại tắt. Ví dụ: `M`, `R` (baze hoặc dên) |
| **E** | Tên loại | **Tên loại** | Tên miểng. Ví dụ: `Miểng baze`, `Miểng dên` |
| **F** | PARNO | **PARNO** | Part Number. Ví dụ: `4W8091`, `9N5923` |
| **G** | Cung trong | **Cung trong** | Thông số kỹ thuật trong. Ví dụ: *(Trống)* |
| **H** | Cung ngoài | **Cung ngoài** | Đường kính ngoài của miểng (mm). Ví dụ: `94.195`, `73.74` |
| **I** | Cao | **Cao** | Chiều cao bản miểng (mm). Ví dụ: `25.4`, `24.3` |
| **J** | Dày | **Dày** | Chiều dày bản miểng (mm). Ví dụ: `2.604`, `2.407` |
| **K** | ĐVT | **ĐVT** | Đơn vị đóng gói. Ví dụ: `Bộ` |
| **L** | Mã HH | **Mã HH** | Mã hàng hóa liên kết. Ví dụ: *(Trống)* |
| **M** | Thương hiệu | **Thương hiệu** | Hãng sản xuất. Ví dụ: *(Trống)* |
| **N** | Vốn | **Vốn** | Giá vốn. Ví dụ: *(Trống)* |
| **O** | VIP | **VIP** | Giá VIP. Ví dụ: *(Trống)* |
| **P** | Ưu đãi | **Ưu đãi** | Giá ưu đãi. Ví dụ: *(Trống)* |
| **Q** | Đại lý | **Đại lý** | Giá đại lý. Ví dụ: *(Trống)* |
| **R** | Gara | **Gara** | Giá gara. Ví dụ: *(Trống)* |
| **S** | Tồn | **Tồn** | Trạng thái tồn. Ví dụ: `CÓ` |

---

## 11. CẤU TRÚC CỘT - SHEET: `BẠC THAU`
- **Tên trong Excel:** `BẠC THAU`
- **Tổng số cột:** `12` Cột

| Ký hiệu | Tên Cột (Gốc) | Tên Cột (Làm sạch) | Mô tả & Ví dụ mẫu |
| :---: | :--- | :--- | :--- |
| **A** | Mã HH | **Mã HH** | Mã hàng bạc thau. Ví dụ: `HH0635`, `HH01076` |
| **B** | Tên vật tư | **Tên vật tư** | Tên bạc thau động cơ. Ví dụ: `Bạc thau 4BB1/4BD1/4BG1 - TAIHO` |
| **C** | ĐK | **ĐK** | Đường kính (mm). Ví dụ: `102/105`, `102` |
| **D** | ĐVT | **ĐVT** | Đơn vị tính. Ví dụ: `Cái` |
| **E** | Vốn | **Vốn** | Giá vốn. Ví dụ: *(Trống)* |
| **F** | VIP | **VIP** | Giá VIP. Ví dụ: *(Trống)* |
| **G** | Ưu đãi | **Ưu đãi** | Giá ưu đãi. Ví dụ: *(Trống)* |
| **H** | Đại lý | **Đại lý** | Giá đại lý. Ví dụ: *(Trống)* |
| **I** | Gara | **Gara** | Giá gara. Ví dụ: *(Trống)* |
| **J** | Tồn | **Tồn** | Trạng thái tồn. Ví dụ: *(Trống)* |
| **K** | PARNO | **PARNO** | Part Number. Ví dụ: *(Trống)* |
| **L** | Ghi chú | **Ghi chú** | Ghi chú phụ trợ. Ví dụ: *(Trống)* |

---

## 12. CẤU TRÚC CỘT - SHEET: `CĂN DỌC`
- **Tên trong Excel:** `CĂN DỌC`
- **Tổng số cột:** `12` Cột

| Ký hiệu | Tên Cột (Gốc) | Tên Cột (Làm sạch) | Mô tả & Ví dụ mẫu |
| :---: | :--- | :--- | :--- |
| **A** | Mã HH | **Mã HH** | Mã hàng căn dọc. Ví dụ: `HH080557`, `HH080558` |
| **B** | Tên vật tư | **Tên vật tư** | Tên căn dọc và mã cos. Ví dụ: `Căn dọc 1DZ Cos0 - TDC - T9383A` |
| **C** | ĐK | **ĐK** | Đường kính (mm). Ví dụ: `86`, `88` |
| **D** | ĐVT | **ĐVT** | Đơn vị tính. Ví dụ: `Bộ` |
| **E** | Vốn | **Vốn** | Giá vốn. Ví dụ: *(Trống)* |
| **F** | VIP | **VIP** | Giá VIP (VND). Ví dụ: `55,000`, `300,000` |
| **G** | Ưu đãi | **Ưu đãi** | Giá ưu đãi (VND). Ví dụ: `60,000`, `330,000` |
| **H** | Đại lý | **Đại lý** | Giá đại lý (VND). Ví dụ: `70,000`, `360,000` |
| **I** | Gara | **Gara** | Giá gara. Ví dụ: *(Trống)* |
| **J** | Tồn | **Tồn** | Trạng thái tồn. Ví dụ: *(Trống)* |
| **K** | PARNO | **PARNO** | Part Number. Ví dụ: *(Trống)* |
| **L** | Ghi chú | **Ghi chú** | Ghi chú. Ví dụ: *(Trống)* |
