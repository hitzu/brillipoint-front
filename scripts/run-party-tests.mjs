import { readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const outDir = join(tmpdir(), "bookandsign-party-tests");

const collectTestFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectTestFiles(entryPath);
      }

      return entry.name.endsWith(".test.js") ? [entryPath] : [];
    }),
  );

  return nestedFiles.flat();
};

const run = (command, args, extraEnv = {}) => {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "pipe",
    env: { ...process.env, ...extraEnv },
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
};

try {
  await rm(outDir, { force: true, recursive: true });

  run("node_modules/.bin/tsc", [
    "--target",
    "es2020",
    "--module",
    "commonjs",
    "--moduleResolution",
    "node",
    "--lib",
    "es2020,dom",
    "--types",
    "node",
    "--skipLibCheck",
    "--esModuleInterop",
    "--strict",
    "--noEmit",
    "false",
    "--outDir",
    outDir,
    "src/features/party/utils/eventStatus.ts",
    "src/features/party/utils/freshThemeCache.ts",
    "src/features/party/utils/mediaActions.ts",
    "src/features/party/utils/sessionShare.ts",
    "src/features/party/utils/sourceTracking.ts",
    "src/features/party/utils/tokensToEventPageTheme.ts",
    "src/features/party/utils/buildSessionItems.ts",
    "src/features/party/utils/formatSplashDate.ts",
    "src/features/party/utils/formatOverviewDate.ts",
    "src/features/party/utils/buildRecoverPhotosUrl.ts",
    "src/features/party/experiences/fotobooth/Carousel/stores/useFotoBoothCarouselStore.ts",
    "src/features/party/theme/systemDefaultTheme.ts",
    "src/features/party/theme/systemDefaultPageTheme.ts",
    "src/features/party/theme/confettiColors.ts",
    "src/features/party/theme/translate.ts",
    "src/features/party/theme/resolveThemeText.ts",
    "src/features/party/theme/buildWhatsAppLink.ts",
    "src/features/party/theme/buildSocialCtaViewModel.ts",
    "src/features/party/theme/buildRewardPromoViewModel.ts",
    "src/features/party/theme/primaryActionButtonVariant.ts",
    "src/features/party/theme/resolveImageAlt.ts",
    "src/features/party/theme/shouldRenderDecoration.ts",
    "src/features/party/theme/confettiShapes.ts",
    "src/features/party/theme/buildConfettiPieces.ts",
    "src/features/party/theme/resolveSplashLayout.ts",
    "src/features/party/theme/socialSecondaryChipColors.ts",
    "src/features/party/utils/themeVars.ts",
    "src/features/party/experiences/fotobooth/Carousel/export/generateStaticExportAsset.ts",
    "src/features/party/hooks/eventThemeState.ts",
    "src/features/party/i18n/dictionaries/es.ts",
    "src/features/party/i18n/dictionaries/en.ts",
    "src/features/party/i18n/types.ts",
    "src/features/party/i18n/translate.ts",
    "src/features/party/i18n/resolveLocale.ts",
    "src/features/party/i18n/localeStorage.ts",
    "src/features/party/i18n/__tests__/i18n.test.ts",
    "src/features/party/i18n/__tests__/localeStorage.test.ts",
    "src/features/party/utils/__tests__/eventStatus.test.ts",
    "src/features/party/utils/__tests__/freshThemeCache.test.ts",
    "src/features/party/utils/__tests__/mediaActions.test.ts",
    "src/features/party/utils/__tests__/sessionShare.test.ts",
    "src/features/party/utils/__tests__/sourceTracking.test.ts",
    "src/features/party/utils/__tests__/tokensToEventPageTheme.test.ts",
    "src/features/party/utils/__tests__/buildSessionItems.test.ts",
    "src/features/party/utils/__tests__/formatSplashDate.test.ts",
    "src/features/party/utils/__tests__/formatOverviewDate.test.ts",
    "src/features/party/utils/__tests__/buildRecoverPhotosUrl.test.ts",
    "src/features/party/experiences/fotobooth/Carousel/stores/__tests__/useFotoBoothCarouselStore.test.ts",
    "src/features/party/theme/__tests__/systemDefaultTheme.test.ts",
    "src/features/party/theme/__tests__/confettiColors.test.ts",
    "src/features/party/theme/__tests__/translate.test.ts",
    "src/features/party/theme/__tests__/resolveThemeText.test.ts",
    "src/features/party/theme/__tests__/buildWhatsAppLink.test.ts",
    "src/features/party/theme/__tests__/buildSocialCtaViewModel.test.ts",
    "src/features/party/theme/__tests__/buildRewardPromoViewModel.test.ts",
    "src/features/party/theme/__tests__/primaryActionButtonVariant.test.ts",
    "src/features/party/theme/__tests__/resolveImageAlt.test.ts",
    "src/features/party/theme/__tests__/shouldRenderDecoration.test.ts",
    "src/features/party/theme/__tests__/buildConfettiPieces.test.ts",
    "src/features/party/theme/__tests__/resolveSplashLayout.test.ts",
    "src/features/party/theme/__tests__/socialSecondaryChipColors.test.ts",
    "src/features/party/theme/__tests__/fotoboothOverviewCssContract.test.ts",
    "src/features/party/theme/__tests__/socialCtaCssContract.test.ts",
    "src/features/party/theme/__tests__/themeFontsCssContract.test.ts",
    "src/features/party/experiences/fotobooth/Carousel/export/__tests__/generateStaticExportAsset.test.ts",
    "src/features/party/hooks/__tests__/eventThemeState.test.ts",
    "--resolveJsonModule",
  ]);

  const testFiles = await collectTestFiles(outDir);

  // Compiled files land in a scratch tmpdir with no node_modules chain of
  // its own — point Node's CommonJS resolver back at the project's
  // node_modules so runtime deps (e.g. zustand) resolve.
  run("node", ["--test", ...testFiles], {
    NODE_PATH: join(process.cwd(), "node_modules"),
  });
} finally {
  await rm(outDir, { force: true, recursive: true });
}
