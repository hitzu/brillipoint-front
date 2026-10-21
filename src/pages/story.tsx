import type { ReactElement } from "react";
import NonLayout from "@layout/NonLayout";
import { StoryPage } from "../features/story/pages/StoryPage";

const Story = () => <StoryPage />;

Story.getLayout = (page: ReactElement) => <NonLayout>{page}</NonLayout>;

export default Story;
