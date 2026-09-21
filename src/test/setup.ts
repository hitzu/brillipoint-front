import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Explicit registration keeps component tests isolated without global test APIs.
afterEach(cleanup);
