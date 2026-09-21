import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import type { ContractOption } from "../types";
import { searchContracts } from "../services/contractPickerService";
import styles from "./ContractPicker.module.css";

interface Props {
  value: number | null;
  onChange: (contractId: number | null) => void;
  /** When set, the contract is fixed by the caller: no lookup, no editing. */
  lockedLabel?: string;
  disabled?: boolean;
}

export const label = (contract: ContractOption) =>
  `${contract.sku} — ${contract.clientName}`.trim();

export const ContractPicker = ({
  value,
  onChange,
  lockedLabel,
  disabled = false,
}: Props) => {
  const [contracts, setContracts] = useState<ContractOption[]>([]);
  const [failed, setFailed] = useState(false);
  // `null` means "showing the current selection"; a string means the user is
  // typing a query, which is what the option list filters on.
  const [query, setQuery] = useState<string | null>(null);
  const listId = useRef(
    `contract-picker-${Math.random().toString(36).slice(2)}`
  ).current;

  useEffect(() => {
    if (lockedLabel) return;
    let cancelled = false;
    searchContracts()
      .then((loaded) => {
        if (!cancelled) setContracts(loaded);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [lockedLabel]);

  const selected = useMemo(
    () => contracts.find((contract) => contract.id === value) ?? null,
    [contracts, value]
  );

  const matches = useMemo(() => {
    if (query === null) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return contracts.slice(0, 8);
    return contracts
      .filter((contract) =>
        `${contract.sku} ${contract.clientName}`.toLowerCase().includes(needle)
      )
      .slice(0, 8);
  }, [contracts, query]);

  if (lockedLabel)
    return (
      <Form.Group controlId="booking-contract">
        <Form.Label>Contrato</Form.Label>
        <Form.Control aria-label="Contrato" value={lockedLabel} disabled />
      </Form.Group>
    );

  const displayed = query !== null ? query : selected ? label(selected) : "";

  const choose = (contract: ContractOption) => {
    onChange(contract.id);
    setQuery(null);
  };

  return (
    <Form.Group controlId="booking-contract" className={styles.picker}>
      <Form.Label>Contrato</Form.Label>
      <InputGroup>
        <Form.Control
          aria-label="Contrato"
          autoComplete="off"
          role="combobox"
          aria-expanded={matches.length > 0}
          aria-controls={listId}
          value={displayed}
          placeholder="Busca por SKU o cliente"
          disabled={disabled}
          onFocus={() => setQuery((current) => current ?? "")}
          onChange={(event) => setQuery(event.target.value)}
        />
        {value !== null ? (
          <Button
            type="button"
            variant="outline-secondary"
            aria-label="Quitar contrato"
            disabled={disabled}
            onClick={() => {
              onChange(null);
              setQuery(null);
            }}
          >
            ×
          </Button>
        ) : null}
      </InputGroup>
      {failed ? (
        <small role="status" className="text-warning">
          No se pudieron cargar los contratos. El evento se guardará sin
          contrato.
        </small>
      ) : null}
      {matches.length ? (
        <ul className={styles.options} id={listId} role="listbox">
          {matches.map((contract) => (
            <li key={contract.id}>
              <button
                type="button"
                role="option"
                aria-selected={contract.id === value}
                className={styles.option}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(contract)}
              >
                {label(contract)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </Form.Group>
  );
};
