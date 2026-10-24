import type { Metadata } from "next";
import { ReviewsClient } from "./reviews-client";

export const metadata: Metadata = { title: "Reviews", description: "Read and reply to reviews from your charging guests." };

export default function ReviewsPage() { return <ReviewsClient />; }
