import { KINDS, postHref } from "./format";
import { absoluteUrl, categoryHref, cityHref, SITE_URL } from "./site";
import type { Category, Comment, PostDetail, PostListItem } from "./types";

/** schema.org BreadcrumbList from [name, path] pairs. */
export function breadcrumbs(items: [string, string][]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: absoluteUrl(path) })),
  };
}

/** The usual trail for a post: Home › Category › City. */
export function postBreadcrumbs(post: Pick<PostDetail, "category" | "city">) {
  const items: [string, string][] = [
    ["Home", "/"],
    [post.category.name, categoryHref(post.category.slug)],
  ];
  if (post.city) items.push([`${post.category.name} in ${post.city}`, categoryHref(post.category.slug, post.city)]);
  return breadcrumbs(items);
}

function place(post: PostDetail) {
  const address =
    post.address || post.area || post.city
      ? {
          "@type": "PostalAddress",
          ...(post.address ? { streetAddress: post.address } : {}),
          ...(post.area || post.city ? { addressLocality: post.area ?? post.city } : {}),
          ...(post.city ? { addressRegion: post.city } : {}),
          addressCountry: "BD",
        }
      : { "@type": "PostalAddress", addressCountry: "BD" };
  return {
    "@type": "LocalBusiness",
    name: post.placeName ?? post.title,
    address,
    geo: { "@type": "GeoCoordinates", latitude: post.lat, longitude: post.lng },
    ...(post.phone ? { telephone: post.phone } : {}),
    ...(post.images[0] ? { image: post.images[0].url } : {}),
    hasMap: `https://www.google.com/maps/search/?api=1&query=${post.lat},${post.lng}`,
  };
}

/**
 * Rated reviews of a named place become a schema.org Review (eligible for star snippets);
 * everything else is user-generated discussion, which Google reads as DiscussionForumPosting.
 */
export function postJsonLd(post: PostDetail, comments: Comment[] = []) {
  const url = absoluteUrl(postHref(post));
  const author = post.author
    ? { "@type": "Person", name: post.authorName, url: absoluteUrl(`/u/${post.author.username}`) }
    : { "@type": "Person", name: post.authorName };
  const images = post.images.map((i) => i.url);
  const common = {
    "@id": `${url}#post`,
    url,
    author,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    inLanguage: /[ঀ-৿]/.test(post.body) ? "bn" : "en",
    ...(images.length ? { image: images } : {}),
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
  const main =
    post.rating && (post.kind === "REVIEW" || post.kind === "RECOMMENDATION") && post.placeName
      ? {
          "@type": "Review",
          ...common,
          name: post.title,
          reviewBody: post.body,
          reviewRating: { "@type": "Rating", ratingValue: post.rating, bestRating: 5, worstRating: 1 },
          itemReviewed: place(post),
          publisher: { "@id": `${SITE_URL}/#organization` },
        }
      : {
          "@type": "DiscussionForumPosting",
          ...common,
          headline: post.title.slice(0, 110),
          text: post.body,
          articleSection: `${KINDS[post.kind].label} · ${post.category.name}`,
          commentCount: post.commentCount,
          interactionStatistic: [
            { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: post.helpfulCount },
            { "@type": "InteractionCounter", interactionType: "https://schema.org/CommentAction", userInteractionCount: post.commentCount },
          ],
          contentLocation: {
            "@type": "Place",
            name: post.placeName ?? ([post.area, post.city].filter(Boolean).join(", ") || "Bangladesh"),
            geo: { "@type": "GeoCoordinates", latitude: post.lat, longitude: post.lng },
          },
          ...(post.placeName ? { about: place(post) } : {}),
          ...(comments.length
            ? {
                comment: comments.map((c) => ({
                  "@type": "Comment",
                  text: c.body,
                  datePublished: c.createdAt,
                  author: c.author
                    ? { "@type": "Person", name: c.authorName, url: absoluteUrl(`/u/${c.author.username}`) }
                    : { "@type": "Person", name: c.authorName },
                })),
              }
            : {}),
        };
  return { "@context": "https://schema.org", "@graph": [main, postBreadcrumbs(post)] };
}

/** ItemList of posts for a landing page (category, city or both). */
export function landingJsonLd({
  name,
  description,
  path,
  posts,
  trail,
}: {
  name: string;
  description: string;
  path: string;
  posts: PostListItem[];
  trail: [string, string][];
}) {
  const url = absoluteUrl(path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        url,
        name,
        description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: posts.length,
          itemListElement: posts.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(postHref(p)), name: p.title })),
        },
      },
      breadcrumbs(trail),
    ],
  };
}

export const categoryTrail = (c: Pick<Category, "name" | "slug">, city?: string | null): [string, string][] => [
  ["Home", "/"],
  [c.name, categoryHref(c.slug)],
  ...(city ? ([[`${c.name} in ${city}`, categoryHref(c.slug, city)]] as [string, string][]) : []),
];

export const cityTrail = (city: string): [string, string][] => [
  ["Home", "/"],
  [`Best in ${city}`, cityHref(city)],
];
