"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, ImagePlus, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CATEGORIES } from "@/data/categories";
import { DROPDOWN_ITEM_HOVER } from "@/lib/dropdown-item-hover";
import {
  createProduct,
  updateProduct,
  uploadProductImage,
  type ProductInput,
} from "@/app/admin/actions";
import { toast } from "sonner";

// `<input type="datetime-local">` wants "YYYY-MM-DDTHH:mm" in local time,
// not an ISO string — this bridges what we store (ISO, UTC) to what the
// input can display, and back again on change (see the onChange above).
function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface ProductFormProps {
  productId?: string;
  initial?: ProductInput;
  existingCategories?: string[];
}

const emptyProduct: ProductInput = {
  name: "",
  description: "",
  price: "0.00",
  imageUrl: "/placeholder.jpg",
  images: [],
  category: "Other",
  rooms: [],
  stock: 0,
  plasticWeightKg: "0.00",
  discountPercent: 0,
  discountReason: "",
  dealEndsAt: null,
};

export function ProductForm({ productId, initial, existingCategories = [] }: ProductFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProductInput>(initial ?? emptyProduct);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Only start showing red outlines after the admin actually tries to
  // continue — a brand-new, all-blank form shouldn't look broken before
  // anyone's typed anything.
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Extra gallery photos (beyond the cover photo above) — a product
  // typically has 4+ pictures, so these get uploaded and managed
  // separately from the single cover-photo flow.
  const MAX_EXTRA_PHOTOS = 7;
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const extraFileInputRef = useRef<HTMLInputElement>(null);

  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const matchingCategories = existingCategories.filter((c) =>
    c.toLowerCase().includes(values.category.trim().toLowerCase())
  );

  function update<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toggleRoom(room: string, checked: boolean) {
    setValues((v) => ({
      ...v,
      rooms: checked ? [...v.rooms, room] : v.rooms.filter((r) => r !== room),
    }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview while the real upload is still in flight —
    // swapped for the real blob URL once that resolves below.
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploading(true);

    const formData = new FormData();
    formData.set("file", file);

    // uploadProductImage catches its own errors and returns { success:
    // false } for anything inside its try block — but a session that
    // expired mid-edit (requireAdmin's redirect()), a request that got
    // rejected before the action even ran (e.g. an oversized body), or a
    // plain network drop all surface as a *thrown* error here instead of a
    // resolved result. Without this try/catch/finally, any of those left
    // uploading stuck on "Uploading…" forever with no feedback — which is
    // exactly what an oversized image looked like before the body size
    // limit fix in next.config.mjs.
    let result: Awaited<ReturnType<typeof uploadProductImage>>;
    try {
      result = await uploadProductImage(formData);
    } catch {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);
      toast.error("Upload failed — please try again.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(false);
    URL.revokeObjectURL(objectUrl);

    if (!result.success) {
      setPreviewUrl(null);
      toast.error(result.error);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    update("imageUrl", result.url);
    setPreviewUrl(null); // now shown via values.imageUrl itself instead
  }

  async function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const remainingSlots = MAX_EXTRA_PHOTOS - values.images.length;
    if (remainingSlots <= 0) {
      toast.error(`You can add up to ${MAX_EXTRA_PHOTOS} extra photos.`);
      if (extraFileInputRef.current) extraFileInputRef.current.value = "";
      return;
    }
    const toUpload = files.slice(0, remainingSlots);
    if (files.length > toUpload.length) {
      toast.error(`Only added ${toUpload.length} — that's the max of ${MAX_EXTRA_PHOTOS} extra photos.`);
    }

    setUploadingExtra(true);
    // Uploaded one at a time (not Promise.all) so a failure partway through
    // still keeps whatever succeeded before it, instead of losing the batch.
    for (const file of toUpload) {
      const formData = new FormData();
      formData.set("file", file);
      try {
        const result = await uploadProductImage(formData);
        if (!result.success) {
          toast.error(`${file.name}: ${result.error}`);
          continue;
        }
        setValues((v) => ({ ...v, images: [...v.images, result.url] }));
      } catch {
        toast.error(`${file.name}: upload failed — please try again.`);
      }
    }
    setUploadingExtra(false);
    if (extraFileInputRef.current) extraFileInputRef.current.value = "";
  }

  function removePhoto(index: number) {
    setValues((v) => ({ ...v, images: v.images.filter((_, i) => i !== index) }));
  }

  // Swaps an extra photo into the cover slot — the photo that was
  // previously the cover takes its place in the extra-photos list, so
  // nothing gets lost, they just trade places.
  function makeCoverPhoto(index: number) {
    setValues((v) => {
      const nextImages = [...v.images];
      const promoted = nextImages[index];
      nextImages[index] = v.imageUrl;
      return { ...v, imageUrl: promoted, images: nextImages };
    });
  }

  // The 5 fields an admin can't skip: name, description, a real cover
  // photo (not the placeholder), a real price, a valid stock count, and
  // a category. Discount is deliberately optional — 0% is a normal,
  // complete state for it, not a missing one — so it's not in this list.
  // Rooms isn't either: leaving it blank is meaningful (see
  // handleSubmit below, where that's saved as fitting all rooms
  // automatically) rather than an error to flag.
  function getMissingRequiredFields(v: ProductInput): Set<string> {
    const missing = new Set<string>();
    if (!v.name.trim()) missing.add("name");
    if (!v.description.trim()) missing.add("description");
    if (!v.imageUrl || v.imageUrl === "/placeholder.jpg") missing.add("cover");
    if (!(parseFloat(v.price) > 0)) missing.add("price");
    if (!Number.isInteger(v.stock) || v.stock < 0) missing.add("stock");
    if (!v.category.trim()) missing.add("category");
    return missing;
  }

  const missingFields = hasAttemptedSubmit ? getMissingRequiredFields(values) : new Set<string>();

  function fieldErrorClass(key: string) {
    return missingFields.has(key) ? "border-destructive ring-2 ring-destructive/30" : "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    const missing = getMissingRequiredFields(values);
    if (missing.size > 0) {
      toast.error("Fill in the highlighted fields before continuing.");
      // Scroll to whichever required field is missing and comes first in
      // the form, rather than leaving the admin to hunt for it.
      const fieldOrder = ["name", "description", "price", "stock", "category", "cover"];
      const firstMissing = fieldOrder.find((key) => missing.has(key));
      const elementId = firstMissing === "cover" ? "cover-photo-section" : firstMissing;
      document.getElementById(elementId!)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // No room checked means "fits anywhere" — save that as an explicit
    // "all" rather than an empty list, so it shows up as a real "Fits:
    // All" tag on the product page instead of just showing nothing.
    const payload: ProductInput = {
      ...values,
      rooms: values.rooms.length > 0 ? values.rooms : ["all"],
    };

    setSubmitting(true);
    try {
      if (productId) {
        await updateProduct(productId, payload);
        toast.success("Product updated");
      } else {
        await createProduct(payload);
        toast.success("Product created");
      }
      router.push("/admin/products");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong saving this product.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          required
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          className={fieldErrorClass("name")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          className={fieldErrorClass("description")}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="price">
            Price (ETB) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="price"
            required
            inputMode="decimal"
            value={values.price}
            onChange={(e) => update("price", e.target.value)}
            className={fieldErrorClass("price")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stock">
            Stock <span className="text-destructive">*</span>
          </Label>
          <Input
            id="stock"
            type="number"
            min={0}
            required
            value={values.stock}
            onChange={(e) => update("stock", Number(e.target.value))}
            className={fieldErrorClass("stock")}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="category">
            Category <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="category"
              required
              autoComplete="off"
              value={values.category}
              onChange={(e) => {
                update("category", e.target.value);
                setCategoryDropdownOpen(true);
              }}
              onFocus={() => setCategoryDropdownOpen(true)}
              onBlur={() => setCategoryDropdownOpen(false)}
              className={fieldErrorClass("category")}
            />
            {categoryDropdownOpen && matchingCategories.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-popover p-1 shadow-md">
                {matchingCategories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    // Fires before the input's onBlur, so clicking a
                    // suggestion doesn't close the dropdown before the
                    // click itself registers.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      update("category", c);
                      setCategoryDropdownOpen(false);
                    }}
                    className={`block w-full rounded-md px-3 py-1.5 text-left text-sm outline-hidden ${DROPDOWN_ITEM_HOVER}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Pick an existing category above, or just type a new one.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="plasticWeightKg">Plastic diverted (kg)</Label>
          <Input
            id="plasticWeightKg"
            inputMode="decimal"
            value={values.plasticWeightKg}
            onChange={(e) => update("plasticWeightKg", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Rooms</Label>
        <p className="text-xs text-muted-foreground">
          Which room(s) this fits — a piece can belong to more than one. Leave every box unchecked
          if it fits anywhere; that&apos;s saved as fitting all rooms automatically.
        </p>
        <div className="flex flex-wrap gap-4 pt-1">
          {CATEGORIES.map((room) => (
            <label key={room.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={values.rooms.includes(room.title)}
                onCheckedChange={(checked) => toggleRoom(room.title, checked === true)}
              />
              {room.title}
            </label>
          ))}
        </div>
      </div>

      <div id="cover-photo-section" className="space-y-1.5">
        <Label>
          Cover photo <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          The main photo shown in the catalog, on the product card, and in search results.
        </p>
        <div className="flex items-start gap-4">
          <div
            className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted ${fieldErrorClass("cover")}`}
          >
            {(previewUrl || values.imageUrl) && (
              <Image
                src={previewUrl || values.imageUrl}
                alt=""
                fill
                unoptimized={!!previewUrl} // a blob: object URL, not a real remote image
                className="object-cover"
              />
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
              id="image-upload"
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
              {uploading ? "Uploading…" : values.imageUrl ? "Replace image" : "Upload image"}
            </Button>
            <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP, up to 4MB.</p>
            <Input
              value={values.imageUrl}
              onChange={(e) => update("imageUrl", e.target.value)}
              placeholder="Or paste an image URL directly"
              className="text-xs"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Additional photos</Label>
        <p className="text-xs text-muted-foreground">
          Extra angles and details shown in the product gallery and cycled through when
          shoppers hover the product card. Up to {MAX_EXTRA_PHOTOS}, on top of the cover photo.
        </p>

        {values.images.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-1">
            {values.images.map((url, index) => (
              <div key={url + index} className="group relative h-24 w-24 shrink-0">
                <div className="relative h-full w-full overflow-hidden rounded-lg border border-border/60 bg-muted">
                  <Image src={url} alt="" fill className="object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  aria-label="Remove photo"
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-1 text-destructive-foreground shadow"
                >
                  <X className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => makeCoverPhoto(index)}
                  className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 rounded-b-lg bg-background/85 py-1 text-[0.65rem] font-medium opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Star className="h-2.5 w-2.5" />
                  Make cover
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2">
          <input
            ref={extraFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleAddPhotos}
            disabled={uploadingExtra || values.images.length >= MAX_EXTRA_PHOTOS}
            className="hidden"
            id="extra-images-upload"
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploadingExtra || values.images.length >= MAX_EXTRA_PHOTOS}
            onClick={() => extraFileInputRef.current?.click()}
          >
            {uploadingExtra ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {uploadingExtra
              ? "Uploading…"
              : values.images.length >= MAX_EXTRA_PHOTOS
                ? "Max photos reached"
                : "Add photos"}
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            {values.images.length}/{MAX_EXTRA_PHOTOS} added — select multiple files at once, or
            add them one by one.
          </p>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-emerald-700/30 bg-emerald-700/5 p-4">
        <Label>
          Discount <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          Leave at 0% for no discount. By default it runs until you change it back —
          set an end time below to turn it into a flash sale with a countdown.
        </p>
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="discountPercent">Discount %</Label>
            <Input
              id="discountPercent"
              type="number"
              min={0}
              max={99}
              value={values.discountPercent}
              onChange={(e) => update("discountPercent", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="discountReason">Reason (shown to customers)</Label>
            <Input
              id="discountReason"
              value={values.discountReason}
              onChange={(e) => update("discountReason", e.target.value)}
              placeholder="Launch week discount"
            />
          </div>
        </div>
        <div className="space-y-1.5 pt-1">
          <Label htmlFor="dealEndsAt">
            Flash sale ends{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="dealEndsAt"
            type="datetime-local"
            value={toDatetimeLocalValue(values.dealEndsAt)}
            onChange={(e) =>
              update("dealEndsAt", e.target.value ? new Date(e.target.value).toISOString() : null)
            }
          />
          <p className="text-xs text-muted-foreground">
            Leave blank to run with no scheduled end. Set a time and the storefront
            shows a live countdown next to the discount until it passes.
          </p>
        </div>
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {productId ? "Save changes" : "Create product"}
      </Button>
    </form>
  );
}
