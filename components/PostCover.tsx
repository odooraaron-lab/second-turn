import Image from "next/image";
import type { Post } from "@/content/types";
import { postImages } from "@/content/post-images";
import { PostThumb } from "./PostThumb";

type Props = {
  post: Pick<Post, "slug" | "category">;
  /** "thumb": a small framed picture above the date in lists. "wide": full width, for post pages and cards. */
  variant?: "thumb" | "wide";
  priority?: boolean;
  alt?: string;
};

export const coverUrl = (slug: string) => (postImages.has(slug) ? `/blog/${slug}.jpg` : null);

/** The illustrated cover for a blog post, falling back to the small generated icon if a post has none yet. */
export function PostCover({ post, variant = "thumb", priority = false, alt = "" }: Props) {
  const src = coverUrl(post.slug);

  if (variant === "wide") {
    return (
      <span className="post-cover post-cover-wide">
        {src ? (
          <Image src={src} alt={alt} fill sizes="(min-width: 820px) 760px, 100vw" priority={priority} />
        ) : (
          <PostThumb post={post} size={72} />
        )}
      </span>
    );
  }

  return (
    <span className="post-cover">
      {src ? <Image src={src} alt={alt} width={184} height={138} sizes="184px" /> : <PostThumb post={post} size={88} />}
    </span>
  );
}
