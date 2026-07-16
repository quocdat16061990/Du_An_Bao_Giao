import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  Loader2,
  Upload,
  Star,
  Trash2,
  Plus,
  Image as ImageIcon,
} from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { useProductCrud, type ProductInput } from '../helper/use-product-crud'
import type { Product } from '../helper/types'
import { getMediaUrl } from '@/lib/media'
import { cn } from '@/lib/utils'

interface ProductFormDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
}

const PRODUCT_LOAI_OPTIONS = [
  { value: 'turbo', label: 'Turbo đầy đủ' },
  { value: 'ruot', label: 'Ruột turbo' },
  { value: 'piston', label: 'Piston' },
  { value: 'sec_mang', label: 'Séc măng' },
  { value: 'xy_lanh', label: 'Xy lanh' },
  { value: 'bo_hoi', label: 'Bộ hơi' },
  { value: 'ron_bo', label: 'Ron bộ' },
  { value: 'ron_mieng', label: 'Ron miếng' },
  { value: 'ron_cat_te', label: 'Ron cát te' },
  { value: 'mieng_bac', label: 'Miếng bạc' },
  { value: 'can_thau', label: 'Căn thau' },
  { value: 'phot_dau', label: 'Phốt đầu trục cơ' },
  { value: 'phot_duoi', label: 'Phốt đuôi trục cơ' },
  { value: 'thun_co', label: 'Thun cò' },
  { value: 'thun_xy_lanh', label: 'Thun xy lanh' },
  { value: 'supap', label: 'Supap' },
  { value: 'truc_co', label: 'Trục cơ' },
  { value: 'bom_nuoc', label: 'Bơm nước' },
  { value: 'nap_quy_lat', label: 'Nắp quy lát' },
  { value: 'bom_nhot', label: 'Bơm nhớt' },
  { value: 'truc_cam', label: 'Trục cam' },
  { value: 'nap_sinh_han', label: 'Nắp sinh hàn' },
  { value: 'ruot_sinh_han', label: 'Ruột sinh hàn' },
  { value: 'ket_nuoc', label: 'Két nước' },
  { value: 'nhip_tay_bien', label: 'Nhíp tay biên' },
  { value: 'sam_bac', label: 'Sam bạc' },
  { value: 'loc_may', label: 'Lọc máy' },
  { value: 'van_hang_nhiet', label: 'Van hằng nhiệt' },
  { value: 'vanh_rang_banh_da', label: 'Vành răng bánh đà' },
  { value: 'ong_dan_nhien_lieu', label: 'Ống dẫn nhiên liệu' },
  { value: 'sen_cam', label: 'Sên cam' },
  { value: 'xy_lanh_cu', label: 'Xy lanh cũ' },
  { value: 'so_linh_kien_turbo', label: 'Số & Linh kiện Turbo' },
]

export function ProductFormDialog({
  isOpen,
  onOpenChange,
  product,
}: ProductFormDialogProps) {
  const isEdit = !!product
  const { createProduct, updateProduct, uploadImage, isCreating, isUpdating, isUploading } = useProductCrud()

  // ── Image States ──
  const [mainImage, setMainImage] = useState<string>('')
  const [imageList, setImageList] = useState<string[]>([])

  // ── Fetch associations ──
  const { data: categories = [] } = useQuery<Array<{ id: number; ten: string }>>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get('/categories/')
      return data
    },
    staleTime: 300_000,
  })

  const { data: hangMayList = [] } = useQuery<Array<{ id: number; ten: string }>>({
    queryKey: ['hang-may'],
    queryFn: async () => {
      const { data } = await apiClient.get('/hang-may/')
      return data
    },
    staleTime: 300_000,
  })

  const { data: hangSxList = [] } = useQuery<Array<{ id: number; ten: string }>>({
    queryKey: ['hang-sx'],
    queryFn: async () => {
      const { data } = await apiClient.get('/hang-sx/')
      return data
    },
    staleTime: 300_000,
  })

  const { data: thuongHieuList = [] } = useQuery<Array<{ id: number; ten: string }>>({
    queryKey: ['thuong-hieu'],
    queryFn: async () => {
      const { data } = await apiClient.get('/thuong-hieu/')
      return data
    },
    staleTime: 300_000,
  })

  // ── react-hook-form Setup ──
  const { register, handleSubmit, reset, setValue, watch } = useForm<ProductInput>()

  const loaiValue = watch('loai')

  useEffect(() => {
    if (isOpen) {
      if (product) {
        // Edit mode: Fill values
        reset({
          loai: product.loai,
          ma_vt: product.ma_vt,
          ten_hang: product.ten_hang ?? '',
          dvt: product.dvt ?? 'Cái',
          doi_th_sx: product.doi_th_sx ?? '',
          parno: product.parno ?? '',
          hang_may: product.hang_may,
          hang_sx: product.hang_sx,
          thuong_hieu: product.thuong_hieu,
          category: product.category,
          model_turbo: product.model_turbo ?? '',
          ma_dong_co: product.ma_dong_co ?? '',
          oem_part_no: product.oem_part_no ?? '',
          dac_diem: product.dac_diem ?? '',
          ung_dung: product.ung_dung ?? '',
          ghi_chu: product.ghi_chu ?? '',
          gia_von: product.gia_von,
          gia_vip: product.gia_vip,
          gia_uu_dai: product.gia_uu_dai,
          gia_dai_ly: product.gia_dai_ly,
          gia_gara: product.gia_gara,
          gia_dl_10: product.gia_dl_10,
          cg_duoi: product.cg_duoi,
          cg_dinh: product.cg_dinh,
          cg_so: product.cg_so ?? '',
          cl_duoi: product.cl_duoi,
          cl_dinh: product.cl_dinh,
          cl_so: product.cl_so ?? '',
          is_active: product.is_active,
        })
        setMainImage(product.hinh_anh ?? '')
        setImageList(product.danh_sach_hinh_anh ?? [])
      } else {
        // Create mode: Reset to defaults
        reset({
          loai: 'turbo',
          ma_vt: '',
          ten_hang: '',
          dvt: 'Cái',
          doi_th_sx: '',
          parno: '',
          hang_may: hangMayList[0]?.id || 0,
          hang_sx: null,
          thuong_hieu: null,
          category: null,
          model_turbo: '',
          ma_dong_co: '',
          oem_part_no: '',
          dac_diem: '',
          ung_dung: '',
          ghi_chu: '',
          gia_von: null,
          gia_vip: null,
          gia_uu_dai: null,
          gia_dai_ly: null,
          gia_gara: null,
          gia_dl_10: null,
          cg_duoi: null,
          cg_dinh: null,
          cg_so: '',
          cl_duoi: null,
          cl_dinh: null,
          cl_so: '',
          is_active: true,
        })
        setMainImage('')
        setImageList([])
      }
    }
  }, [isOpen, product, reset, hangMayList])

  const onSubmit = async (data: ProductInput) => {
    // Basic validation
    if (!data.ma_vt.trim()) {
      toast.error('Vui lòng nhập Mã VT')
      return
    }
    if (!data.hang_may) {
      toast.error('Vui lòng chọn Hãng máy')
      return
    }

    const payload: ProductInput = {
      ...data,
      hinh_anh: mainImage,
      danh_sach_hinh_anh: imageList,
      // Chuyển đổi các trường số
      gia_von: data.gia_von ? Number(data.gia_von) : null,
      gia_vip: data.gia_vip ? Number(data.gia_vip) : null,
      gia_uu_dai: data.gia_uu_dai ? Number(data.gia_uu_dai) : null,
      gia_dai_ly: data.gia_dai_ly ? Number(data.gia_dai_ly) : null,
      gia_gara: data.gia_gara ? Number(data.gia_gara) : null,
      gia_dl_10: data.gia_dl_10 ? Number(data.gia_dl_10) : null,
      // Chuyển đổi thông số kĩ thuật sang string hoặc float nếu cần
      cg_duoi: data.cg_duoi ? String(data.cg_duoi) : null,
      cg_dinh: data.cg_dinh ? String(data.cg_dinh) : null,
      cl_duoi: data.cl_duoi ? String(data.cl_duoi) : null,
      cl_dinh: data.cl_dinh ? String(data.cl_dinh) : null,
    }

    try {
      if (isEdit && product) {
        await updateProduct({ id: product.id, data: payload })
        toast.success('Cập nhật sản phẩm thành công!')
      } else {
        await createProduct(payload)
        toast.success('Thêm sản phẩm thành công!')
      }
      onOpenChange(false)
    } catch (err: unknown) {
      console.error(err)
      toast.error('Lưu sản phẩm thất bại. Hãy kiểm tra lại dữ liệu.')
    }
  }

  // ── Image Handlers ──
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const uploadedUrls: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const res = await uploadImage(file)
        uploadedUrls.push(res.url)
      } catch (err) {
        console.error(err)
        toast.error(`Tải lên hình ảnh ${file.name} thất bại`)
      }
    }

    if (uploadedUrls.length > 0) {
      const newList = [...imageList, ...uploadedUrls]
      setImageList(newList)
      if (!mainImage) {
        setMainImage(uploadedUrls[0])
      }
      toast.success('Tải ảnh lên thành công!')
    }
  }

  const handleSetMainImage = (url: string) => {
    setMainImage(url)
    toast.info('Đã chọn ảnh này làm ảnh chính')
  }

  const handleRemoveImage = (url: string) => {
    const newList = imageList.filter((img) => img !== url)
    setImageList(newList)
    if (mainImage === url) {
      setMainImage(newList[0] || '')
    }
    toast.info('Đã gỡ ảnh khỏi danh sách')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 border border-border/40 shadow-2xl bg-card overflow-hidden">
        <DialogHeader className="px-6 py-4 bg-slate-900 border-b border-slate-800 text-white shrink-0">
          <DialogTitle className="text-lg font-bold">
            {isEdit ? 'Cập Nhật Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-[13px]">
            {isEdit
              ? 'Chỉnh sửa thông tin chi tiết và lưu thay đổi vào cơ sở dữ liệu.'
              : 'Điền đầy đủ thông tin để tạo mới một sản phẩm phụ tùng động cơ.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1 px-6 py-5 overflow-y-auto">
            <div className="space-y-6">
              {/* 1. THÔNG TIN PHÂN LOẠI CHUNG */}
              <div className="bg-muted/10 border border-border/40 rounded-xl p-4 space-y-4">
                <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Phân loại chung & Định danh
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="loai" className="text-[13px] font-semibold">Loại sản phẩm *</Label>
                    <Select
                      value={watch('loai') || 'turbo'}
                      onValueChange={(val) => setValue('loai', val)}
                    >
                      <SelectTrigger id="loai" className="h-9 text-[13px]">
                        <SelectValue placeholder="Chọn loại sản phẩm" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {PRODUCT_LOAI_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-[13px]">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ma_vt" className="text-[13px] font-semibold">Mã Vật Tư (Mã VT) *</Label>
                    <Input
                      id="ma_vt"
                      {...register('ma_vt')}
                      placeholder="VD: HH90123"
                      className="h-9 text-[13px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ten_hang" className="text-[13px] font-semibold">Tên hàng / Mô tả ngắn</Label>
                    <Input
                      id="ten_hang"
                      {...register('ten_hang')}
                      placeholder="VD: Cánh Quạt CUMMINS"
                      className="h-9 text-[13px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="dvt" className="text-[13px] font-semibold">Đơn vị tính (ĐVT)</Label>
                    <Input
                      id="dvt"
                      {...register('dvt')}
                      placeholder="VD: Cái, Bộ, Cặp"
                      className="h-9 text-[13px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="doi_th_sx" className="text-[13px] font-semibold">Đời / Thế hệ SX</Label>
                    <Input
                      id="doi_th_sx"
                      {...register('doi_th_sx')}
                      placeholder="VD: D6AC, PC200-8"
                      className="h-9 text-[13px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="parno" className="text-[13px] font-semibold">Part Number gốc</Label>
                    <Input
                      id="parno"
                      {...register('parno')}
                      placeholder="VD: 3590022"
                      className="h-9 text-[13px]"
                    />
                  </div>
                </div>
              </div>

              {/* 2. LIÊN KẾT ĐỐI TƯỢNG */}
              <div className="bg-muted/10 border border-border/40 rounded-xl p-4 space-y-4">
                <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Hãng máy & Hãng sản xuất
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="hang_may" className="text-[13px] font-semibold">Hãng máy *</Label>
                    <Select
                      value={watch('hang_may') ? String(watch('hang_may')) : undefined}
                      onValueChange={(val) => setValue('hang_may', Number(val))}
                    >
                      <SelectTrigger id="hang_may" className="h-9 text-[13px]">
                        <SelectValue placeholder="Chọn hãng máy" />
                      </SelectTrigger>
                      <SelectContent>
                        {hangMayList.map((hm) => (
                          <SelectItem key={hm.id} value={String(hm.id)} className="text-[13px]">
                            {hm.ten}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="hang_sx" className="text-[13px] font-semibold">Hãng sản xuất</Label>
                    <Select
                      value={watch('hang_sx') ? String(watch('hang_sx')) : 'null'}
                      onValueChange={(val) => setValue('hang_sx', val === 'null' ? null : Number(val))}
                    >
                      <SelectTrigger id="hang_sx" className="h-9 text-[13px]">
                        <SelectValue placeholder="Chọn hãng sản xuất" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null" className="text-[13px] text-muted-foreground">Không có</SelectItem>
                        {hangSxList.map((hs) => (
                          <SelectItem key={hs.id} value={String(hs.id)} className="text-[13px]">
                            {hs.ten}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="thuong_hieu" className="text-[13px] font-semibold">Thương hiệu</Label>
                    <Select
                      value={watch('thuong_hieu') ? String(watch('thuong_hieu')) : 'null'}
                      onValueChange={(val) => setValue('thuong_hieu', val === 'null' ? null : Number(val))}
                    >
                      <SelectTrigger id="thuong_hieu" className="h-9 text-[13px]">
                        <SelectValue placeholder="Chọn thương hiệu" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null" className="text-[13px] text-muted-foreground">Không có</SelectItem>
                        {thuongHieuList.map((th) => (
                          <SelectItem key={th.id} value={String(th.id)} className="text-[13px]">
                            {th.ten}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-[13px] font-semibold">Danh mục</Label>
                    <Select
                      value={watch('category') ? String(watch('category')) : 'null'}
                      onValueChange={(val) => setValue('category', val === 'null' ? null : Number(val))}
                    >
                      <SelectTrigger id="category" className="h-9 text-[13px]">
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null" className="text-[13px] text-muted-foreground">Không có</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)} className="text-[13px]">
                            {cat.ten}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 3. BẢNG GIÁ (6 MỨC) */}
              <div className="bg-muted/10 border border-border/40 rounded-xl p-4 space-y-4">
                <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Giá bán (VND)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="gia_von" className="text-[13px] font-semibold">Giá vốn</Label>
                    <Input
                      id="gia_von"
                      type="number"
                      {...register('gia_von')}
                      placeholder="Liên hệ"
                      className="h-9 text-[13px] font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gia_vip" className="text-[13px] font-semibold text-amber-500">Giá VIP</Label>
                    <Input
                      id="gia_vip"
                      type="number"
                      {...register('gia_vip')}
                      placeholder="Liên hệ"
                      className="h-9 text-[13px] font-mono text-amber-600 dark:text-amber-400 font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gia_uu_dai" className="text-[13px] font-semibold text-orange-500">Giá ưu đãi</Label>
                    <Input
                      id="gia_uu_dai"
                      type="number"
                      {...register('gia_uu_dai')}
                      placeholder="Liên hệ"
                      className="h-9 text-[13px] font-mono text-orange-600 dark:text-orange-400 font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gia_dai_ly" className="text-[13px] font-semibold text-blue-500">Giá đại lý</Label>
                    <Input
                      id="gia_dai_ly"
                      type="number"
                      {...register('gia_dai_ly')}
                      placeholder="Liên hệ"
                      className="h-9 text-[13px] font-mono text-blue-600 dark:text-blue-400 font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gia_gara" className="text-[13px] font-semibold text-purple-500">Giá Gara</Label>
                    <Input
                      id="gia_gara"
                      type="number"
                      {...register('gia_gara')}
                      placeholder="Liên hệ"
                      className="h-9 text-[13px] font-mono text-purple-600 dark:text-purple-400 font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gia_dl_10" className="text-[13px] font-semibold text-slate-500">Giá ĐL+10%</Label>
                    <Input
                      id="gia_dl_10"
                      type="number"
                      {...register('gia_dl_10')}
                      placeholder="Liên hệ"
                      className="h-9 text-[13px] font-mono text-slate-600 dark:text-slate-400 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* 4. HÌNH ẢNH */}
              <div className="bg-muted/10 border border-border/40 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Hình ảnh sản phẩm
                  </h3>
                  {isUploading && (
                    <div className="flex items-center gap-1.5 text-[13px] text-amber-500 font-medium">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Đang tải ảnh lên...
                    </div>
                  )}
                </div>

                {/* Upload zone */}
                <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-6 text-center cursor-pointer relative group">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div className="text-[13px] font-bold text-foreground">Kéo thả hoặc bấm để tải ảnh lên</div>
                    <div className="text-[12px] text-muted-foreground">Định dạng hỗ trợ: JPG, JPEG, PNG, WEBP, GIF</div>
                  </div>
                </div>

                {/* Thumbnail list */}
                {imageList.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {imageList.map((url, idx) => {
                      const isMain = mainImage === url
                      return (
                        <div
                          key={idx}
                          className={cn(
                            'group/thumb relative aspect-square rounded-lg border overflow-hidden bg-muted/20 transition-all',
                            isMain ? 'border-amber-500 ring-2 ring-amber-500/20 scale-105' : 'border-border/60 hover:border-border'
                          )}
                        >
                          <img
                            src={getMediaUrl(url)}
                            alt={`Product preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSetMainImage(url)}
                              className={cn(
                                'p-1.5 rounded bg-black/60 text-white hover:bg-black/80 transition-colors',
                                isMain ? 'text-amber-400' : 'text-white'
                              )}
                              title="Chọn làm ảnh chính"
                            >
                              <Star className="h-3.5 w-3.5 fill-current" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(url)}
                              className="p-1.5 rounded bg-black/60 text-red-400 hover:bg-black/80 transition-colors"
                              title="Xóa hình ảnh này"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {isMain && (
                            <div className="absolute top-1 left-1 bg-amber-500 text-white font-extrabold text-[12px] px-1 rounded shadow-sm uppercase">
                              Ảnh chính
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="h-20 rounded-lg border border-dashed border-border/60 bg-muted/5 flex flex-col items-center justify-center text-muted-foreground/50 text-[12px] gap-1.5">
                    <ImageIcon className="h-6 w-6 opacity-40" />
                    <span>Sản phẩm chưa có hình ảnh. Hãy tải lên ảnh của bạn.</span>
                  </div>
                )}
              </div>

              {/* 5. TURBO-SPECIFIC DETAILS (HIỂN THỊ KHI LOẠI LÀ TURBO/RUOT/SO_LINH_KIEN) */}
              {(loaiValue === 'turbo' || loaiValue === 'ruot' || loaiValue === 'so_linh_kien_turbo') && (
                <div className="bg-muted/10 border border-border/40 rounded-xl p-4 space-y-4">
                  <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Thông số Turbo đặc thù
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="model_turbo" className="text-[13px] font-semibold">Model Turbo</Label>
                      <Input
                        id="model_turbo"
                        {...register('model_turbo')}
                        placeholder="VD: GT35, S200G"
                        className="h-9 text-[13px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="ma_dong_co" className="text-[13px] font-semibold">Mã động cơ</Label>
                      <Input
                        id="ma_dong_co"
                        {...register('ma_dong_co')}
                        placeholder="VD: 6D24, S6KT"
                        className="h-9 text-[13px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="oem_part_no" className="text-[13px] font-semibold">OEM Part No</Label>
                      <Input
                        id="oem_part_no"
                        {...register('oem_part_no')}
                        placeholder="VD: ME123456"
                        className="h-9 text-[13px]"
                      />
                    </div>
                  </div>

                  {/* Kĩ thuật CG CL */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="cg_duoi" className="text-[13px] font-semibold">CG Ø Dưới</Label>
                      <Input
                        id="cg_duoi"
                        type="text"
                        {...register('cg_duoi')}
                        placeholder="mm"
                        className="h-9 text-[13px] font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cg_dinh" className="text-[13px] font-semibold">CG Ø Đỉnh</Label>
                      <Input
                        id="cg_dinh"
                        type="text"
                        {...register('cg_dinh')}
                        placeholder="mm"
                        className="h-9 text-[13px] font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cg_so" className="text-[13px] font-semibold">CG Số</Label>
                      <Input
                        id="cg_so"
                        {...register('cg_so')}
                        placeholder="Số"
                        className="h-9 text-[13px] font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cl_duoi" className="text-[13px] font-semibold">CL Ø Dưới</Label>
                      <Input
                        id="cl_duoi"
                        type="text"
                        {...register('cl_duoi')}
                        placeholder="mm"
                        className="h-9 text-[13px] font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cl_dinh" className="text-[13px] font-semibold">CL Ø Đỉnh</Label>
                      <Input
                        id="cl_dinh"
                        type="text"
                        {...register('cl_dinh')}
                        placeholder="mm"
                        className="h-9 text-[13px] font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cl_so" className="text-[13px] font-semibold">CL Số</Label>
                      <Input
                        id="cl_so"
                        {...register('cl_so')}
                        placeholder="Số"
                        className="h-9 text-[13px] font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. ĐẶC ĐIỂM, ỨNG DỤNG, GHI CHÚ */}
              <div className="bg-muted/10 border border-border/40 rounded-xl p-4 space-y-4">
                <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Chi tiết nội dung & Ghi chú
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="dac_diem" className="text-[13px] font-semibold">Đặc điểm sản phẩm</Label>
                    <Textarea
                      id="dac_diem"
                      {...register('dac_diem')}
                      placeholder="Mô tả các đặc điểm nhận dạng, kích thước, cấu tạo..."
                      className="min-h-16 text-[13px] resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ung_dung" className="text-[13px] font-semibold">Ứng dụng thực tế</Label>
                    <Textarea
                      id="ung_dung"
                      {...register('ung_dung')}
                      placeholder="Các đời xe, động cơ, thiết bị sử dụng..."
                      className="min-h-16 text-[13px] resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ghi_chu" className="text-[13px] font-semibold">Ghi chú nội bộ</Label>
                    <Textarea
                      id="ghi_chu"
                      {...register('ghi_chu')}
                      placeholder="Ghi chú thêm về giá cả, nhà cung cấp hoặc lưu ý khác..."
                      className="min-h-16 text-[13px] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* 7. METADATA / IS ACTIVE */}
              <div className="flex items-center space-x-2 py-1 bg-muted/5 border border-border/30 rounded-xl px-4 h-11 justify-between">
                <div className="flex flex-col">
                  <Label htmlFor="is_active" className="text-[13px] font-bold">Hiển thị sản phẩm</Label>
                  <span className="text-[12px] text-muted-foreground">Sản phẩm ẩn sẽ không hiển thị trên trang tìm kiếm.</span>
                </div>
                <Checkbox
                  id="is_active"
                  checked={watch('is_active')}
                  onCheckedChange={(checked) => setValue('is_active', !!checked)}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/60 flex items-center justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-[13px] font-bold"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isCreating || isUpdating}
              className="h-9 px-5 text-[13px] font-bold bg-amber-500 text-slate-955 hover:bg-amber-600 transition-colors"
            >
              {(isCreating || isUpdating) ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {isEdit ? 'Lưu Thay Đổi' : 'Tạo Sản Phẩm'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
