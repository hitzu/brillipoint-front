import React from "react";
import {
  PREP_PROFILE_QUESTIONS,
  PrepProfileQuestionDefinition,
} from "../../../booking/components/questions";
import {
  TATTOO_DESIGNS_MAX,
  TATTOO_DESIGNS_QUESTION_ID,
} from "../../../booking/utils/tattooDesigns";
import { PrepProfileAnswers } from "../../../../interfaces";

type Props = {
  answers: PrepProfileAnswers;
};

type AssetLike = { path: string; mime: string; url?: string };

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isAssetLike = (v: unknown): v is AssetLike =>
  isPlainObject(v) && typeof v.path === "string" && typeof v.mime === "string";

const isImage = (asset: AssetLike): boolean =>
  asset.mime.toLowerCase().startsWith("image/");

function AssetThumbnails({ assets, alt }: { assets: AssetLike[]; alt: string }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {assets.map((asset, index) =>
        asset.url && isImage(asset) ? (
          <a
            key={asset.path}
            href={asset.url}
            target="_blank"
            rel="noreferrer"
            title="Abrir imagen"
          >
            <img
              src={asset.url}
              alt={`${alt} ${index + 1}`}
              style={{
                width: 96,
                height: 96,
                objectFit: "cover",
                borderRadius: 8,
                border: "1px solid #dee2e6",
              }}
            />
          </a>
        ) : (
          <a key={asset.path} href={asset.url} target="_blank" rel="noreferrer">
            {asset.path.split("/").pop()}
          </a>
        ),
      )}
    </div>
  );
}

function Value({
  value,
  question,
  label,
}: {
  value: unknown;
  question?: PrepProfileQuestionDefinition;
  label: string;
}): React.ReactElement {
  if (typeof value === "boolean") return <span>{value ? "Sí" : "No"}</span>;
  if (typeof value === "string" || typeof value === "number") {
    const option = question?.options?.find((o) => o.value === value);
    return <span>{option?.label ?? String(value)}</span>;
  }
  if (isAssetLike(value)) return <AssetThumbnails assets={[value]} alt={label} />;
  if (Array.isArray(value)) {
    if (value.length > 0 && value.every(isAssetLike)) {
      return <AssetThumbnails assets={value} alt={label} />;
    }
    return <span>{value.map(String).join(", ")}</span>;
  }
  if (isPlainObject(value)) {
    return (
      <ul className="list-unstyled mb-0">
        {Object.entries(value).map(([key, inner]) => (
          <li key={key}>
            <small className="text-muted">{key}: </small>
            <Value value={inner} label={`${label} ${key}`} />
          </li>
        ))}
      </ul>
    );
  }
  return <span>—</span>;
}

export function PrepProfileAnswersView({ answers }: Props) {
  const tattooDesigns = Array.isArray(answers[TATTOO_DESIGNS_QUESTION_ID])
    ? (answers[TATTOO_DESIGNS_QUESTION_ID] as unknown[]).filter(isAssetLike)
    : [];

  const answered = PREP_PROFILE_QUESTIONS.filter(
    (q) => q.id in answers && answers[q.id] != null,
  );
  const knownIds = new Set(PREP_PROFILE_QUESTIONS.map((q) => q.id));
  const unknownKeys = Object.keys(answers).filter(
    (key) =>
      !knownIds.has(key) &&
      key !== TATTOO_DESIGNS_QUESTION_ID &&
      answers[key] != null,
  );

  if (answered.length === 0 && unknownKeys.length === 0 && tattooDesigns.length === 0) {
    return <p className="mb-0">Sin respuestas todavía.</p>;
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {tattooDesigns.length > 0 ? (
        <section aria-labelledby="tattoo-designs-title">
          <h6 id="tattoo-designs-title">Diseños de tatuajes</h6>
          <small className="text-muted d-block mb-2">
            {`${tattooDesigns.length} de ${TATTOO_DESIGNS_MAX} diseños`}
          </small>
          <AssetThumbnails assets={tattooDesigns} alt="Diseño" />
        </section>
      ) : null}

      {answered.map((question) => (
        <div key={question.id}>
          <div className="fw-bold">{question.label ?? question.id}</div>
          <Value
            value={answers[question.id]}
            question={question}
            label={question.label ?? question.id}
          />
        </div>
      ))}

      {unknownKeys.map((key) => (
        <div key={key}>
          <div className="fw-bold">{key}</div>
          <Value value={answers[key]} label={key} />
        </div>
      ))}
    </div>
  );
}
