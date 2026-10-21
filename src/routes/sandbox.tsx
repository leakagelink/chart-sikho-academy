import { createFileRoute } from "@tanstack/react-router";
import { MockChrome } from "@/components/site/MockChrome";
export const Route = createFileRoute("/sandbox")({ component: MockChrome });