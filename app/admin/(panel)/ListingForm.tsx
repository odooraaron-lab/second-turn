"use client";

import { useActionState, useRef, useState } from "react";
import { saveListing, type SaveState } from "../actions";
import { site } from "@/site.config";
import type { Product } from "@/lib/products";

type Photo = { key: string; url?: string; preview?: string; blur?: string; error?: string };

const MAX_EDGE = 2000;

/**
 * Shrinks phone photos (often 5-12 MB) to a sharp ~2000px JPEG before upload, and makes a
 * tiny blurred preview (under 1 KB) that the shop shows instantly while the real photo loads.
 */
async function prepare(file: File): Promise<{ upload: Blob; blur?: string }> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const tiny = document.createElement("canvas");
    tiny.width = 16;
    tiny.height = Math.max(1, Math.round((16 * bitmap.height) / bitmap.width));
    tiny.getContext("2d")!.drawImage(bitmap, 0, 0, tiny.width, tiny.height);
    const blur = tiny.toDataURL("image/jpeg", 0.6);
    bitmap.close();

    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    return { upload: blob ?? file, blur };
  } catch {
    return { upload: file }; // unusual formats: upload as-is, no preview
  }
}

const cents = (c?: number) => (c === undefined ? "" : (c / 100).toFixed(c % 100 ? 2 : 0));

export function ListingForm({ product }: { product?: Product }) {
  const [state, action, saving] = useActionState<SaveState, FormData>(saveListing, { error: "" });
  const [photos, setPhotos] = useState<Photo[]>(
    (product?.images ?? []).map((url) => ({ key: url, url, blur: product?.blurs?.[url] }))
  );
  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);

  const uploading = photos.some((p) => !p.url && !p.error);
  const urls = photos.filter((p) => p.url).map((p) => p.url!);
  const blurs = Object.fromEntries(photos.filter((p) => p.url && p.blur).map((p) => [p.url!, p.blur!]));

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const batch = Array.from(files).map((file) => ({
      file,
      key: `${Date.now()}-${Math.random()}`,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...batch.map(({ key, preview }) => ({ key, preview }))]);

    await Promise.all(
      batch.map(async ({ file, key }) => {
        const update = (patch: Partial<Photo>) =>
          setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
        try {
          const { upload, blur } = await prepare(file);
          if (blur) update({ blur });
          const body = new FormData();
          body.append("file", upload, "photo.jpg");
          const res = await fetch("/api/admin/upload", { method: "POST", body });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.url) throw new Error(data.error || "Upload failed. Check your connection and try again.");
          update({ url: data.url });
        } catch (e) {
          update({ error: e instanceof Error ? e.message : "Upload failed." });
        }
      })
    );
  }

  const remove = (key: string) => setPhotos((prev) => prev.filter((p) => p.key !== key));
  const makeCover = (key: string) =>
    setPhotos((prev) => [...prev.filter((p) => p.key === key), ...prev.filter((p) => p.key !== key)]);

  const photoInputs = (
    <>
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={libraryInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );

  return (
    <form action={action} className="form">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="images" value={JSON.stringify(urls)} />
      <input type="hidden" name="blurs" value={JSON.stringify(blurs)} />
      {photoInputs}

      <section className="step">
        <div className="step-head">
          <span className="num">1</span>
          <h2>Photos</h2>
        </div>
        {photos.length > 0 && (
          <div className="photos">
            {photos.map((p, i) => (
              <div key={p.key} className={`photo${!p.url && !p.error ? " uploading" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.preview ?? p.url} alt={`Photo ${i + 1}`} />
                {i === 0 && p.url && <span className="cover-tag">Cover</span>}
                {!p.url && !p.error && <span className="progress">Uploading</span>}
                {p.error && <span className="progress form-error">{p.error}</span>}
                <div className="photo-tools">
                  {i > 0 && p.url ? (
                    <button type="button" onClick={() => makeCover(p.key)}>
                      Cover
                    </button>
                  ) : (
                    <span />
                  )}
                  <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => remove(p.key)}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="photo-drop">
          <div className="field-row">
            <button type="button" className="btn" onClick={() => cameraInput.current?.click()}>
              Take photo
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => libraryInput.current?.click()}>
              Choose photos
            </button>
          </div>
          <p className="hint">
            {photos.length ? "The first photo is the cover. Tap Cover on another to swap." : "Box front, box back, then everything laid out. Daylight on a plain table works best."}
          </p>
        </div>
      </section>

      <section className="step">
        <div className="step-head">
          <span className="num">2</span>
          <h2>About the game</h2>
        </div>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input className="input" id="title" name="title" placeholder="Cluedo" defaultValue={product?.title} required />
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <select className="select" id="category" name="category" defaultValue={product?.category ?? site.categories[0].id}>
            {site.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="field choice-set">
          <legend>Is everything in the box?</legend>
          {site.completeness.map((c) => (
            <label key={c.id} className="choice">
              <input
                type="radio"
                name="completeness"
                value={c.id}
                defaultChecked={(product?.completeness ?? "complete") === c.id}
              />
              <span>
                <strong>{c.label}</strong>
                <small>{c.note}</small>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="field">
          <label htmlFor="condition">Condition</label>
          <select className="select" id="condition" name="condition" defaultValue={product?.condition ?? "good"}>
            {site.conditions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}: {c.note}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="description">
            Description <span className="optional">(needed if pieces are missing)</span>
          </label>
          <textarea
            className="textarea"
            id="description"
            name="description"
            placeholder="What's in the box, anything missing, box wear, which edition. Buyers love a mention of old score sheets or house rules in the lid."
            defaultValue={product?.description}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="era">
              Decade <span className="optional">(helps buyers browse)</span>
            </label>
            <select className="select" id="era" name="era" defaultValue={product?.era ?? ""}>
              <option value="">Not sure</option>
              {site.eras.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="year">
              Year <span className="optional">(optional)</span>
            </label>
            <input className="input" id="year" name="year" inputMode="numeric" placeholder="1986" defaultValue={product?.year} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="publisher">
              Publisher <span className="optional">(optional)</span>
            </label>
            <input className="input" id="publisher" name="publisher" placeholder="Waddingtons" defaultValue={product?.publisher} />
          </div>
          <div className="field">
            <label htmlFor="players">
              Players <span className="optional">(optional)</span>
            </label>
            <input className="input" id="players" name="players" placeholder="2 to 6 players" defaultValue={product?.players} />
          </div>
        </div>
        <p className="hint">The copyright year is usually printed on the box bottom or the back of the rules.</p>
      </section>

      <section className="step">
        <div className="step-head">
          <span className="num">3</span>
          <h2>Price</h2>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="price">Price</label>
            <div className="money">
              <span aria-hidden>$</span>
              <input className="input" id="price" name="price" inputMode="decimal" placeholder="25" defaultValue={cents(product?.price_cents)} required />
            </div>
          </div>
          <div className="field">
            <label htmlFor="shipping">Courier</label>
            <div className="money">
              <span aria-hidden>$</span>
              <input
                className="input"
                id="shipping"
                name="shipping"
                inputMode="decimal"
                defaultValue={product ? cents(product.shipping_cents) : String(site.defaultShippingNzd)}
                required
              />
            </div>
          </div>
        </div>
        <p className="hint">
          NZ dollars. Courier is added on top at checkout
          {site.pickup.enabled ? `; buyers picking up in ${site.pickup.town} pay nothing extra` : ""}.
        </p>
      </section>

      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}

      <div className="form-actions">
        {product ? (
          <>
            <button className="btn" type="submit" disabled={saving || uploading}>
              {uploading ? "Waiting for photos" : saving ? "Saving" : "Save changes"}
            </button>
            <a className="btn btn-quiet" href="/admin">
              Cancel
            </a>
          </>
        ) : (
          <>
            <button className="btn" type="submit" name="intent" value="publish" disabled={saving || uploading}>
              {uploading ? "Waiting for photos" : saving ? "Saving" : "Put in shop"}
            </button>
            <button className="btn btn-quiet" type="submit" name="intent" value="hide" disabled={saving || uploading}>
              Save hidden
            </button>
          </>
        )}
      </div>
    </form>
  );
}
