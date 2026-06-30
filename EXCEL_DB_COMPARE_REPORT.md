# BÁO CÁO ĐỐI CHIẾU DỮ LIỆU EXCEL VÀ DATABASE

Báo cáo chi tiết đối chiếu sản phẩm giữa file Excel `BAO GIA BO HOI - SEC MANG (DA DO GIA PISTON).xlsx` và cơ sở dữ liệu SQLite/PostgreSQL hiện tại.

## TỔNG QUAN HỢP NHẤT ĐỐI CHIẾU
- **Tổng số sản phẩm quét từ Excel:** `4297`
- **Tổng số lượng khớp hoàn toàn giá:** `1455`
- **Tổng số lượng lệch giá:** `1450`
- **Tổng số lượng chưa có trong DB:** `1392`

---

## SHEET: `PISTON` (Loại: `piston`)
- **Tổng số sản phẩm trong Excel:** `702`
- **Số lượng khớp hoàn toàn giá:** `70`
- **Số lượng lệch giá:** `272`
- **Số lượng chưa có trong DB:** `360`

### Danh sách sản phẩm lệch giá:
- `[HH082015]` (DM100): Giá VIP: Excel `2100000` vs DB `None`, Giá Ưu đãi: Excel `2250000` vs DB `None`, Giá Đại lý: Excel `2400000` vs DB `None`
- `[HH083874]` (EC100): Giá VIP: Excel `2250000` vs DB `None`, Giá Ưu đãi: Excel `2400000` vs DB `None`, Giá Đại lý: Excel `2550000` vs DB `None`
- `[HH082312]` (W04D-T): Giá VIP: Excel `1450000` vs DB `None`, Giá Ưu đãi: Excel `1550000` vs DB `None`, Giá Đại lý: Excel `1650000` vs DB `None`
- `[HH082313]` (W06D/W04D): Giá VIP: Excel `2100000` vs DB `None`, Giá Ưu đãi: Excel `2200000` vs DB `None`, Giá Đại lý: Excel `2350000` vs DB `None`
- `[HH082006]` (W06D/W04D): Giá VIP: Excel `2170000` vs DB `None`, Giá Ưu đãi: Excel `2300000` vs DB `None`, Giá Đại lý: Excel `2460000` vs DB `None`
- `[HH070478]` (EH700): Giá VIP: Excel `2300000` vs DB `None`, Giá Ưu đãi: Excel `2450000` vs DB `None`, Giá Đại lý: Excel `2600000` vs DB `None`
- `[HH070475]` (H07C (NEW)): Giá VIP: Excel `2100000` vs DB `None`, Giá Ưu đãi: Excel `2250000` vs DB `None`, Giá Đại lý: Excel `2400000` vs DB `None`
- `[HH081682]` (H07C (OLD)): Giá VIP: Excel `2700000` vs DB `None`, Giá Ưu đãi: Excel `2900000` vs DB `None`, Giá Đại lý: Excel `3100000` vs DB `None`
- `[HH070808]` (H07C-2): Giá VIP: Excel `2530000` vs DB `None`, Giá Ưu đãi: Excel `2670000` vs DB `None`, Giá Đại lý: Excel `2800000` vs DB `None`
- `[HH082008]` (H07C-T2): Giá VIP: Excel `3050000` vs DB `None`, Giá Ưu đãi: Excel `3250000` vs DB `None`, Giá Đại lý: Excel `3450000` vs DB `None`
- `[HH070473]` (H07D-NEW): Giá VIP: Excel `2250000` vs DB `None`, Giá Ưu đãi: Excel `2400000` vs DB `None`, Giá Đại lý: Excel `2600000` vs DB `None`
- `[HH075633]` (J05E/J08E): Giá VIP: Excel `6000000` vs DB `None`, Giá Ưu đãi: Excel `6500000` vs DB `None`, Giá Đại lý: Excel `7000000` vs DB `None`
- `[HH071883]` (J05E/J08E): Giá VIP: Excel `7500000` vs DB `None`, Giá Ưu đãi: Excel `7900000` vs DB `None`, Giá Đại lý: Excel `8200000` vs DB `None`
- `[HH081163]` (J05E/J08E): Giá VIP: Excel `4550000` vs DB `None`, Giá Ưu đãi: Excel `4800000` vs DB `None`, Giá Đại lý: Excel `5150000` vs DB `None`
- `[HH079464]` (J05ETA (gang)): Giá VIP: Excel `5600000` vs DB `None`, Giá Ưu đãi: Excel `5900000` vs DB `None`, Giá Đại lý: Excel `6200000` vs DB `None`
- `[HH083527]` (J05ETA (gang)): Giá VIP: Excel `5500000` vs DB `None`, Giá Ưu đãi: Excel `5900000` vs DB `None`, Giá Đại lý: Excel `6300000` vs DB `None`
- `[HH082318]` (S05D ( J08C / J05C )): Giá VIP: Excel `2500000` vs DB `None`, Giá Ưu đãi: Excel `2650000` vs DB `None`, Giá Đại lý: Excel `2800000` vs DB `None`
- `[HH070479]` (J08C): Giá VIP: Excel `2500000` vs DB `None`, Giá Ưu đãi: Excel `2650000` vs DB `None`, Giá Đại lý: Excel `2800000` vs DB `None`
- `[HH082716]` (J08C): Giá VIP: Excel `2500000` vs DB `None`, Giá Ưu đãi: Excel `2650000` vs DB `None`, Giá Đại lý: Excel `2800000` vs DB `None`
- `[HH072017]` (J08C-2): Giá Đại lý: Excel `480000` vs DB `None`
- *...và còn 252 sản phẩm lệch giá khác.*
### Danh sách sản phẩm chưa có trong DB:
- `[HH00115]`: Không tồn tại trong DB
- `[HH070481]`: Không tồn tại trong DB
- `[HH070753]`: Không tồn tại trong DB
- `[HH070482]`: Không tồn tại trong DB
- `[HH070486]`: Không tồn tại trong DB
- `[HH070811]`: Không tồn tại trong DB
- `[HH070487]`: Không tồn tại trong DB
- `[HH070489]`: Không tồn tại trong DB
- `[HH082919]`: Không tồn tại trong DB
- `[HH076519]`: Không tồn tại trong DB
- `[HH082012]`: Không tồn tại trong DB
- `[HH081299]`: Không tồn tại trong DB
- `[HH071346]`: Không tồn tại trong DB
- `[HH075088]`: Không tồn tại trong DB
- `[HH070500]`: Không tồn tại trong DB
- `[HH071039]`: Không tồn tại trong DB
- `[HH070491]`: Không tồn tại trong DB
- `[HH00347]`: Không tồn tại trong DB
- `[HH071890]`: Không tồn tại trong DB
- `[HH00722]`: Không tồn tại trong DB
- *...và còn 340 sản phẩm chưa có khác.*

---


## SHEET: `SÉC MĂNG` (Loại: `sec_mang`)
- **Tổng số sản phẩm trong Excel:** `644`
- **Số lượng khớp hoàn toàn giá:** `174`
- **Số lượng lệch giá:** `407`
- **Số lượng chưa có trong DB:** `63`

### Danh sách sản phẩm lệch giá:
- `[HH083979]` (DM100): Giá VIP: Excel `120000` vs DB `None`, Giá Ưu đãi: Excel `130000` vs DB `None`, Giá Đại lý: Excel `140000` vs DB `None`
- `[HH083716]` (N04C/W04DT/1+3/thép): Giá VIP: Excel `1000000` vs DB `None`, Giá Ưu đãi: Excel `1100000` vs DB `None`, Giá Đại lý: Excel `1200000` vs DB `None`
- `[HH081985]` (W04C-T/W06C/1/thép): Giá VIP: Excel `250000` vs DB `None`, Giá Ưu đãi: Excel `270000` vs DB `None`, Giá Đại lý: Excel `290000` vs DB `None`
- `[HH078927]` (W04D/W04E): Giá VIP: Excel `110000` vs DB `None`, Giá Ưu đãi: Excel `120000` vs DB `None`, Giá Đại lý: Excel `130000` vs DB `None`
- `[HH084322]` (W04D/W04E/nhớt/thép/-/HENWEIT/'R-HN01-00): Giá VIP: Excel `140000` vs DB `None`, Giá Ưu đãi: Excel `150000` vs DB `None`, Giá Đại lý: Excel `160000` vs DB `None`
- `[HH20499]` (W06D/W04D/1+3/thép/1/máy): Giá VIP: Excel `150000` vs DB `None`, Giá Ưu đãi: Excel `170000` vs DB `None`, Giá Đại lý: Excel `200000` vs DB `None`
- `[HH084326]` (H06C-TA): Giá VIP: Excel `180000` vs DB `None`, Giá Ưu đãi: Excel `200000` vs DB `None`, Giá Đại lý: Excel `220000` vs DB `None`
- `[HH073310]` (H06C/1+4/thép/BỘ6): Giá VIP: Excel `1200000` vs DB `None`, Giá Ưu đãi: Excel `1300000` vs DB `None`, Giá Đại lý: Excel `1400000` vs DB `None`
- `[HH084327]` (EH700/H07C): Giá VIP: Excel `150000` vs DB `None`, Giá Ưu đãi: Excel `160000` vs DB `None`, Giá Đại lý: Excel `170000` vs DB `None`
- `[HH0234]` (EH700/H07C/1+4/thép): Giá VIP: Excel `930000` vs DB `None`, Giá Ưu đãi: Excel `990000` vs DB `None`, Giá Đại lý: Excel `1100000` vs DB `None`
- `[HH071313]` (H07CT/1+4/thép): Giá VIP: Excel `1200000` vs DB `None`, Giá Ưu đãi: Excel `1260000` vs DB `None`, Giá Đại lý: Excel `1350000` vs DB `None`
- `[HH070558]` (H07D/1+3thép): Giá VIP: Excel `1000000` vs DB `None`, Giá Ưu đãi: Excel `1100000` vs DB `None`, Giá Đại lý: Excel `1200000` vs DB `None`
- `[HH079583]` (J05E/THÉP): Giá VIP: Excel `750000` vs DB `None`, Giá Ưu đãi: Excel `790000` vs DB `None`, Giá Đại lý: Excel `840000` vs DB `None`
- `[HH084138]` (J08E/J05E): Giá VIP: Excel `150000` vs DB `None`, Giá Ưu đãi: Excel `170000` vs DB `None`, Giá Đại lý: Excel `200000` vs DB `None`
- `[HH084131]` (J08C): Giá VIP: Excel `150000` vs DB `None`, Giá Ưu đãi: Excel `170000` vs DB `None`, Giá Đại lý: Excel `200000` vs DB `None`
- `[HH075424]` (J08C): Giá VIP: Excel `1150000` vs DB `None`, Giá Ưu đãi: Excel `1250000` vs DB `None`, Giá Đại lý: Excel `1300000` vs DB `None`
- `[HH071107]` (EL100/phi): Giá VIP: Excel `1450000` vs DB `None`, Giá Ưu đãi: Excel `1550000` vs DB `None`, Giá Đại lý: Excel `1700000` vs DB `None`
- `[HH074451]` (EP100/P09C/1+4/thép/BỘ6): Giá VIP: Excel `1400000` vs DB `None`, Giá Ưu đãi: Excel `1500000` vs DB `None`, Giá Đại lý: Excel `1600000` vs DB `None`
- `[HH070727]` (P11C/P11B): Giá VIP: Excel `1750000` vs DB `None`, Giá Ưu đãi: Excel `1850000` vs DB `None`, Giá Đại lý: Excel `1950000` vs DB `None`
- `[HH071927]` (EM100/phi): Giá VIP: Excel `1700000` vs DB `None`, Giá Ưu đãi: Excel `1800000` vs DB `None`, Giá Đại lý: Excel `1950000` vs DB `None`
- *...và còn 387 sản phẩm lệch giá khác.*
### Danh sách sản phẩm chưa có trong DB:
- `[HH077306]`: Không tồn tại trong DB
- `[HH079161]`: Không tồn tại trong DB
- `[HH084141]`: Không tồn tại trong DB
- `[HH084144]`: Không tồn tại trong DB
- `[HH074704]`: Không tồn tại trong DB
- `[HH076676]`: Không tồn tại trong DB
- `[HH080053]`: Không tồn tại trong DB
- `[HH080054]`: Không tồn tại trong DB
- `[HH072190]`: Không tồn tại trong DB
- `[HH077164]`: Không tồn tại trong DB
- `[HH071430]`: Không tồn tại trong DB
- `[HH083710]`: Không tồn tại trong DB
- `[HH077168]`: Không tồn tại trong DB
- `[HH072249]`: Không tồn tại trong DB
- `[HH080336]`: Không tồn tại trong DB
- `[HH071447]`: Không tồn tại trong DB
- `[HH082386]`: Không tồn tại trong DB
- `[HH0652]`: Không tồn tại trong DB
- `[HH071446]`: Không tồn tại trong DB
- `[HH082920]`: Không tồn tại trong DB
- *...và còn 43 sản phẩm chưa có khác.*

---


## SHEET: `XY LANH` (Loại: `xy_lanh`)
- **Tổng số sản phẩm trong Excel:** `458`
- **Số lượng khớp hoàn toàn giá:** `67`
- **Số lượng lệch giá:** `355`
- **Số lượng chưa có trong DB:** `36`

### Danh sách sản phẩm lệch giá:
- `[HH080200]` (DM100): Giá VIP: Excel `1480000` vs DB `None`, Giá Ưu đãi: Excel `1580000` vs DB `None`, Giá Đại lý: Excel `1680000` vs DB `None`
- `[HH081232]` (EC100): Giá VIP: Excel `1500000` vs DB `None`, Giá Ưu đãi: Excel `1600000` vs DB `None`, Giá Đại lý: Excel `1700000` vs DB `None`
- `[HH080199]` (W04D-T/W06D-T có lợi ron): Giá VIP: Excel `200000` vs DB `None`, Giá Ưu đãi: Excel `215000` vs DB `None`, Giá Đại lý: Excel `230000` vs DB `None`
- `[HH080195]` (EH100): Giá VIP: Excel `1100000` vs DB `None`, Giá Ưu đãi: Excel `1200000` vs DB `None`, Giá Đại lý: Excel `1300000` vs DB `None`
- `[HH070449]` (EH100): Giá VIP: Excel `1100000` vs DB `None`, Giá Ưu đãi: Excel `1200000` vs DB `None`, Giá Đại lý: Excel `1300000` vs DB `None`
- `[HH079241]` (H06C): Giá VIP: Excel `2750000` vs DB `None`, Giá Ưu đãi: Excel `2900000` vs DB `None`, Giá Đại lý: Excel `3100000` vs DB `None`
- `[HH082001]` (H06C-TA/H06C): Giá VIP: Excel `1360000` vs DB `None`, Giá Ưu đãi: Excel `1450000` vs DB `None`, Giá Đại lý: Excel `1550000` vs DB `None`
- `[HH072679]` (H06C-TA/H06C): Giá Đại lý: Excel `250000` vs DB `None`
- `[HH068739]` (H06C-TA/H06C): Giá VIP: Excel `1200000` vs DB `None`, Giá Ưu đãi: Excel `1300000` vs DB `None`, Giá Đại lý: Excel `1400000` vs DB `None`
- `[HH080197]` (DS50): Giá VIP: Excel `1900000` vs DB `None`, Giá Ưu đãi: Excel `2000000` vs DB `None`, Giá Đại lý: Excel `2100000` vs DB `None`
- `[HH073238]` (H07C): Giá Đại lý: Excel `250000` vs DB `None`
- `[HH079240]` (H07C): Giá Ưu đãi: Excel `1700000` vs DB `None`, Giá Đại lý: Excel `1800000` vs DB `None`
- `[HH079772]` (H07C): Giá VIP: Excel `1360000` vs DB `None`, Giá Ưu đãi: Excel `1450000` vs DB `None`, Giá Đại lý: Excel `1550000` vs DB `None`
- `[HH079040]` (H07C/EH700/H07D): Giá VIP: Excel `1200000` vs DB `None`, Giá Ưu đãi: Excel `1300000` vs DB `None`, Giá Đại lý: Excel `1400000` vs DB `None`
- `[HH084160]` (H07C/EH700/H07D): Giá VIP: Excel `1780000` vs DB `None`, Giá Ưu đãi: Excel `1900000` vs DB `None`, Giá Đại lý: Excel `2050000` vs DB `None`
- `[HH073239]` (J05E/J08E): Giá Đại lý: Excel `250000` vs DB `None`
- `[HH075734]` (J05E/J08E/E0060): Giá VIP: Excel `3200000` vs DB `None`, Giá Ưu đãi: Excel `3500000` vs DB `None`, Giá Đại lý: Excel `3700000` vs DB `None`
- `[HH075733]` (J05E/J08E/S1146-73210): Giá VIP: Excel `3200000` vs DB `None`, Giá Ưu đãi: Excel `3500000` vs DB `None`, Giá Đại lý: Excel `3700000` vs DB `None`
- `[HH079773]` (J08E/J05E): Giá VIP: Excel `240000` vs DB `None`, Giá Ưu đãi: Excel `255000` vs DB `None`, Giá Đại lý: Excel `270000` vs DB `None`
- `[HH072695]` (J08C/J05C): Giá VIP: Excel `1400000` vs DB `None`, Giá Ưu đãi: Excel `1500000` vs DB `None`, Giá Đại lý: Excel `1600000` vs DB `None`
- *...và còn 335 sản phẩm lệch giá khác.*
### Danh sách sản phẩm chưa có trong DB:
- `[HH083908]`: Không tồn tại trong DB
- `[HH081996]`: Không tồn tại trong DB
- `[HH081992]`: Có trong DB nhưng sai loại (Excel: `xy_lanh`, DB: `xy_lanh_cu`)
- `[HH081147]`: Có trong DB nhưng sai loại (Excel: `xy_lanh`, DB: `xy_lanh_cu`)
- `[HH082322]`: Có trong DB nhưng sai loại (Excel: `xy_lanh`, DB: `xy_lanh_cu`)
- `[HH082890]`: Không tồn tại trong DB
- `[HH083256]`: Không tồn tại trong DB
- `[HH00269]`: Không tồn tại trong DB
- `[HH081993]`: Không tồn tại trong DB
- `[HH082309]`: Không tồn tại trong DB
- `[HH081148]`: Không tồn tại trong DB
- `[HH083135]`: Không tồn tại trong DB
- `[HH075478]`: Có trong DB nhưng sai loại (Excel: `xy_lanh`, DB: `xy_lanh_cu`)
- `[HH078146]`: Không tồn tại trong DB
- `[HH083755]`: Có trong DB nhưng sai loại (Excel: `xy_lanh`, DB: `xy_lanh_cu`)
- `[HH073913]`: Có trong DB nhưng sai loại (Excel: `xy_lanh`, DB: `xy_lanh_cu`)
- `[HH084364]`: Không tồn tại trong DB
- `[HH083992]`: Có trong DB nhưng sai loại (Excel: `xy_lanh`, DB: `xy_lanh_cu`)
- `[HH084165]`: Có trong DB nhưng sai loại (Excel: `xy_lanh`, DB: `xy_lanh_cu`)
- `[HH070546]`: Có trong DB nhưng sai loại (Excel: `xy_lanh`, DB: `xy_lanh_cu`)
- *...và còn 16 sản phẩm chưa có khác.*

---


## SHEET: `THUN CÒ` (Loại: `thun_co`)
- **Tổng số sản phẩm trong Excel:** `67`
- **Số lượng khớp hoàn toàn giá:** `63`
- **Số lượng lệch giá:** `0`
- **Số lượng chưa có trong DB:** `4`

### Danh sách sản phẩm chưa có trong DB:
- `[HH074076]`: Không tồn tại trong DB
- `[HH081598]`: Không tồn tại trong DB
- `[HH079321]`: Không tồn tại trong DB
- `[HH0656]`: Không tồn tại trong DB

---


## SHEET: `PHỚT ĐẦU TRỤC CƠ` (Loại: `phot_dau`)
- **Tổng số sản phẩm trong Excel:** `107`
- **Số lượng khớp hoàn toàn giá:** `89`
- **Số lượng lệch giá:** `0`
- **Số lượng chưa có trong DB:** `18`

### Danh sách sản phẩm chưa có trong DB:
- `[HH081102]`: Không tồn tại trong DB
- `[HH079799]`: Không tồn tại trong DB
- `[HH080082]`: Không tồn tại trong DB
- `[HH077076]`: Không tồn tại trong DB
- `[HH073879]`: Không tồn tại trong DB
- `[HH072126]`: Không tồn tại trong DB
- `[HH077079]`: Không tồn tại trong DB
- `[HH077075]`: Không tồn tại trong DB
- `[HH00841]`: Không tồn tại trong DB
- `[HH081101]`: Không tồn tại trong DB
- `[HH081099]`: Không tồn tại trong DB
- `[HH082535]`: Không tồn tại trong DB
- `[HH00473]`: Không tồn tại trong DB
- `[HH079800]`: Không tồn tại trong DB
- `[HH00837]`: Không tồn tại trong DB
- `[HH077059]`: Không tồn tại trong DB
- `[HH00838]`: Không tồn tại trong DB
- `[HH074117]`: Không tồn tại trong DB

---


## SHEET: `PHỚT ĐUÔI TRỤC CƠ` (Loại: `phot_duoi`)
- **Tổng số sản phẩm trong Excel:** `101`
- **Số lượng khớp hoàn toàn giá:** `82`
- **Số lượng lệch giá:** `0`
- **Số lượng chưa có trong DB:** `19`

### Danh sách sản phẩm chưa có trong DB:
- `[HH081096]`: Không tồn tại trong DB
- `[HH074137]`: Không tồn tại trong DB
- `[HH079806]`: Không tồn tại trong DB
- `[HH080083]`: Không tồn tại trong DB
- `[HH082541]`: Không tồn tại trong DB
- `[HH077070]`: Không tồn tại trong DB
- `[HH073880]`: Không tồn tại trong DB
- `[HH079811]`: Không tồn tại trong DB
- `[HH074139]`: Không tồn tại trong DB
- `[HH081097]`: Không tồn tại trong DB
- `[HH082536]`: Không tồn tại trong DB
- `[HH00492]`: Không tồn tại trong DB
- `[HH079807]`: Không tồn tại trong DB
- `[HH00859]`: Không tồn tại trong DB
- `[HH077056]`: Không tồn tại trong DB
- `[HH077060]`: Không tồn tại trong DB
- `[HH079644]`: Không tồn tại trong DB
- `[HH00860]`: Không tồn tại trong DB
- `[HH072704]`: Không tồn tại trong DB

---


## SHEET: `RON BỘ` (Loại: `ron_bo`)
- **Tổng số sản phẩm trong Excel:** `589`
- **Số lượng khớp hoàn toàn giá:** `295`
- **Số lượng lệch giá:** `0`
- **Số lượng chưa có trong DB:** `294`

### Danh sách sản phẩm chưa có trong DB:
- `[HH070878]`: Không tồn tại trong DB
- `[HH070877]`: Không tồn tại trong DB
- `[HH076551]`: Không tồn tại trong DB
- `[HH078080]`: Không tồn tại trong DB
- `[HH070882]`: Không tồn tại trong DB
- `[HH070883]`: Không tồn tại trong DB
- `[HH070881]`: Không tồn tại trong DB
- `[HH077080]`: Không tồn tại trong DB
- `[HH075746]`: Không tồn tại trong DB
- `[HH074292]`: Không tồn tại trong DB
- `[HH072722]`: Không tồn tại trong DB
- `[HH072727]`: Không tồn tại trong DB
- `[HH072090]`: Không tồn tại trong DB
- `[HH081564]`: Không tồn tại trong DB
- `[HH070901]`: Không tồn tại trong DB
- `[HH073117]`: Không tồn tại trong DB
- `[HH083682]`: Không tồn tại trong DB
- `[HH075916]`: Không tồn tại trong DB
- `[HH076528]`: Không tồn tại trong DB
- `[HH072174]`: Không tồn tại trong DB
- *...và còn 274 sản phẩm chưa có khác.*

---


## SHEET: `RON MIẾNG` (Loại: `ron_mieng`)
- **Tổng số sản phẩm trong Excel:** `547`
- **Số lượng khớp hoàn toàn giá:** `266`
- **Số lượng lệch giá:** `0`
- **Số lượng chưa có trong DB:** `281`

### Danh sách sản phẩm chưa có trong DB:
- `[HH00796]`: Không tồn tại trong DB
- `[HH074296]`: Không tồn tại trong DB
- `[HH00773]`: Không tồn tại trong DB
- `[HH077043]`: Không tồn tại trong DB
- `[HH00795]`: Không tồn tại trong DB
- `[HH072082]`: Không tồn tại trong DB
- `[HH070913]`: Không tồn tại trong DB
- `[HH072760]`: Không tồn tại trong DB
- `[HH00812]`: Không tồn tại trong DB
- `[HH00799]`: Không tồn tại trong DB
- `[HH077484]`: Không tồn tại trong DB
- `[HH077491]`: Không tồn tại trong DB
- `[HH081939]`: Không tồn tại trong DB
- `[HH080619]`: Không tồn tại trong DB
- `[HH082557]`: Không tồn tại trong DB
- `[HH00211]`: Không tồn tại trong DB
- `[HH082337]`: Không tồn tại trong DB
- `[HH076267]`: Không tồn tại trong DB
- `[HH078263]`: Không tồn tại trong DB
- `[HH079681]`: Không tồn tại trong DB
- *...và còn 261 sản phẩm chưa có khác.*

---


## SHEET: `MIỂNG TNC` (Loại: `mieng_bac`)
- **Tổng số sản phẩm trong Excel:** `860`
- **Số lượng khớp hoàn toàn giá:** `349`
- **Số lượng lệch giá:** `416`
- **Số lượng chưa có trong DB:** `95`

### Danh sách sản phẩm lệch giá:
- `[HH083728]` (Bạc miểng Hino W04D/W04E (M133K, R133K1)): Giá VIP: Excel `590000` vs DB `None`, Giá Ưu đãi: Excel `630000` vs DB `None`, Giá Đại lý: Excel `680000` vs DB `None`
- `[HH083730]` (Bạc miểng Hino W06D/W06E (M134K, R134K1)): Giá VIP: Excel `1800000` vs DB `None`, Giá Ưu đãi: Excel `1900000` vs DB `None`, Giá Đại lý: Excel `2050000` vs DB `None`
- `[HH080514]` (Miểng baze H06C/H07C cos1  - TDC - M1108): Giá VIP: Excel `550000` vs DB `None`, Giá Ưu đãi: Excel `580000` vs DB `None`, Giá Đại lý: Excel `610000` vs DB `None`
- `[HH080515]` (Miểng baze H06C/H07C cos2  - TDC - M1108): Giá VIP: Excel `550000` vs DB `None`, Giá Ưu đãi: Excel `580000` vs DB `None`, Giá Đại lý: Excel `610000` vs DB `None`
- `[HH080534]` (Miểng dên H06C/H07C cos1 - TDC - R109K): Giá VIP: Excel `490000` vs DB `None`, Giá Ưu đãi: Excel `520000` vs DB `None`, Giá Đại lý: Excel `550000` vs DB `None`
- `[HH080535]` (Miểng dên H06C/H07C cos2 - TDC - R109K): Giá VIP: Excel `500000` vs DB `None`, Giá Ưu đãi: Excel `520000` vs DB `None`, Giá Đại lý: Excel `540000` vs DB `None`
- `[HH078906]` (Bạc miểng J05E Cos0 - MAHLE): Giá VIP: Excel `780000` vs DB `None`, Giá Ưu đãi: Excel `820000` vs DB `None`, Giá Đại lý: Excel `860000` vs DB `None`
- `[HH076393]` (Miểng baze J08C/J05C/J08E/J05E Cos0 (MP2): Giá VIP: Excel `100000` vs DB `None`, Giá Ưu đãi: Excel `110000` vs DB `None`, Giá Đại lý: Excel `120000` vs DB `None`
- `[HH076394]` (Miểng baze J08C/J05C/J08E/J05E Cos1 (MP2): Giá VIP: Excel `100000` vs DB `None`, Giá Ưu đãi: Excel `110000` vs DB `None`, Giá Đại lý: Excel `120000` vs DB `None`
- `[HH076395]` (Miểng baze J08C/J05C/J08E/J05E Cos2 (MP2): Giá VIP: Excel `100000` vs DB `None`, Giá Ưu đãi: Excel `110000` vs DB `None`, Giá Đại lý: Excel `120000` vs DB `None`
- `[HH079888]` (Miểng dên J08E (R226H) Cos0 - CS IVECO): Giá VIP: Excel `330000` vs DB `None`, Giá Ưu đãi: Excel `350000` vs DB `None`, Giá Đại lý: Excel `370000` vs DB `None`
- `[HH079889]` (Miểng dên J08E (R226H) Cos1 - CS IVECO): Giá VIP: Excel `350000` vs DB `None`, Giá Ưu đãi: Excel `370000` vs DB `None`, Giá Đại lý: Excel `390000` vs DB `None`
- `[HH080548]` (Miểng dên  (Cặp) J08E/J05E Cos0 - TDC - ): Giá VIP: Excel `100000` vs DB `None`, Giá Ưu đãi: Excel `110000` vs DB `None`, Giá Đại lý: Excel `120000` vs DB `None`
- `[HH080549]` (Miểng dên  (Cặp) J08E/J05E Cos1 - TDC - ): Giá VIP: Excel `105000` vs DB `None`, Giá Ưu đãi: Excel `115000` vs DB `None`, Giá Đại lý: Excel `125000` vs DB `None`
- `[HH076401]` (Miểng dên J08E/J05E Cos2 (RP226H) - TAIH): Giá VIP: Excel `130000` vs DB `None`, Giá Ưu đãi: Excel `140000` vs DB `None`, Giá Đại lý: Excel `150000` vs DB `None`
- `[HH079886]` (Miểng baze J08E/ J08C (M224H) Cos0 - CS ): Giá VIP: Excel `460000` vs DB `None`, Giá Ưu đãi: Excel `480000` vs DB `None`, Giá Đại lý: Excel `500000` vs DB `None`
- `[HH079887]` (Miểng baze J08E/ J08C (M224H) Cos1 - CS ): Giá VIP: Excel `490000` vs DB `None`, Giá Ưu đãi: Excel `510000` vs DB `None`, Giá Đại lý: Excel `530000` vs DB `None`
- `[HH076396]` (Miểng dên J08C/J05C Cos0 (RP224H1) - TAI): Giá VIP: Excel `80000` vs DB `None`, Giá Ưu đãi: Excel `90000` vs DB `None`, Giá Đại lý: Excel `100000` vs DB `None`
- `[HH076397]` (Miểng dên J08C/J05C Cos1 (RP224H1) - TAI): Giá VIP: Excel `90000` vs DB `None`, Giá Ưu đãi: Excel `100000` vs DB `None`, Giá Đại lý: Excel `110000` vs DB `None`
- `[HH076398]` (Miểng dên J08C/J05C Cos2 (RP224H1) - TAI): Giá VIP: Excel `90000` vs DB `None`, Giá Ưu đãi: Excel `100000` vs DB `None`, Giá Đại lý: Excel `110000` vs DB `None`
- *...và còn 396 sản phẩm lệch giá khác.*
### Danh sách sản phẩm chưa có trong DB:
- `[HH070806]`: Không tồn tại trong DB
- `[HH072029]`: Không tồn tại trong DB
- `[HH071172]`: Không tồn tại trong DB
- `[HH077123]`: Không tồn tại trong DB
- `[HH00603]`: Không tồn tại trong DB
- `[HH080843]`: Không tồn tại trong DB
- `[HH0621]`: Không tồn tại trong DB
- `[HH075603]`: Không tồn tại trong DB
- `[HH072047]`: Không tồn tại trong DB
- `[HH072133]`: Không tồn tại trong DB
- `[HH00398]`: Không tồn tại trong DB
- `[HH071252]`: Không tồn tại trong DB
- `[HH071867]`: Không tồn tại trong DB
- `[HH070749]`: Không tồn tại trong DB
- `[HH074423]`: Không tồn tại trong DB
- `[HH071906]`: Không tồn tại trong DB
- `[HH072713]`: Không tồn tại trong DB
- `[HH071514]`: Không tồn tại trong DB
- `[HH00610]`: Không tồn tại trong DB
- `[HH071226]`: Không tồn tại trong DB
- *...và còn 75 sản phẩm chưa có khác.*

---


## SHEET: `MIỂNG TRA CỨU` (Loại: `mieng_bac`)
- **Tổng số sản phẩm trong Excel:** `0`
- **Số lượng khớp hoàn toàn giá:** `0`
- **Số lượng lệch giá:** `0`
- **Số lượng chưa có trong DB:** `0`


---


## SHEET: `BẠC THAU` (Loại: `can_thau`)
- **Tổng số sản phẩm trong Excel:** `68`
- **Số lượng khớp hoàn toàn giá:** `0`
- **Số lượng lệch giá:** `0`
- **Số lượng chưa có trong DB:** `68`

### Danh sách sản phẩm chưa có trong DB:
- `[HH0635]`: Không tồn tại trong DB
- `[HH01076]`: Không tồn tại trong DB
- `[HH082040]`: Không tồn tại trong DB
- `[HH00087]`: Không tồn tại trong DB
- `[HH00510]`: Không tồn tại trong DB
- `[HH0323]`: Không tồn tại trong DB
- `[HH071412]`: Không tồn tại trong DB
- `[HH071413]`: Không tồn tại trong DB
- `[HH081210]`: Không tồn tại trong DB
- `[HH081209]`: Không tồn tại trong DB
- `[HH00036]`: Không tồn tại trong DB
- `[HH071422]`: Không tồn tại trong DB
- `[HH071427]`: Không tồn tại trong DB
- `[HH00057]`: Không tồn tại trong DB
- `[HH076319]`: Không tồn tại trong DB
- `[HH078363]`: Không tồn tại trong DB
- `[HH076604]`: Không tồn tại trong DB
- `[HH01078]`: Không tồn tại trong DB
- `[HH01079]`: Không tồn tại trong DB
- `[HH071423]`: Không tồn tại trong DB
- *...và còn 48 sản phẩm chưa có khác.*

---


## SHEET: `CĂN DỌC` (Loại: `can_doc`)
- **Tổng số sản phẩm trong Excel:** `154`
- **Số lượng khớp hoàn toàn giá:** `0`
- **Số lượng lệch giá:** `0`
- **Số lượng chưa có trong DB:** `154`

### Danh sách sản phẩm chưa có trong DB:
- `[HH080557]`: Không tồn tại trong DB
- `[HH080558]`: Không tồn tại trong DB
- `[HH074817]`: Không tồn tại trong DB
- `[HH073964]`: Không tồn tại trong DB
- `[HH078932]`: Không tồn tại trong DB
- `[HH080513]`: Không tồn tại trong DB
- `[HH076341]`: Không tồn tại trong DB
- `[HH078969]`: Không tồn tại trong DB
- `[HH078970]`: Không tồn tại trong DB
- `[HH082837]`: Không tồn tại trong DB
- `[HH082838]`: Không tồn tại trong DB
- `[HH076909]`: Không tồn tại trong DB
- `[HH079868]`: Không tồn tại trong DB
- `[HH079869]`: Không tồn tại trong DB
- `[HH00309]`: Không tồn tại trong DB
- `[HH079854]`: Không tồn tại trong DB
- `[HH079855]`: Không tồn tại trong DB
- `[HH00319]`: Không tồn tại trong DB
- `[HH076331]`: Không tồn tại trong DB
- `[HH079876]`: Không tồn tại trong DB
- *...và còn 134 sản phẩm chưa có khác.*

---
