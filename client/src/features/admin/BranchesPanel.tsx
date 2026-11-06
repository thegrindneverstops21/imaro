import { useState, type FormEvent } from "react";
import { displayBrand } from "../../lib/format";
import type { Branch } from "../../types/api";
import {
  afterCreate,
  BLANK_BRANCH,
  BRANCH_FIELDS,
  fieldType,
  type BranchField,
  type BranchInput,
} from "./branchForm";
import { RecordEditor } from "./RecordEditor";
import type { Writes } from "./useAdminWrites";
import { useBranchActions, type BranchEdit } from "./useBranchActions";

type FieldProps = {
  field: (typeof BRANCH_FIELDS)[number];
  value: string;
  onChange: (key: BranchField, value: string) => void;
};

function BranchFieldInput({ field, value, onChange }: FieldProps) {
  const { key, label } = field;
  const wide = key === "description" || key === "address";
  return (
    <label className={wide ? "span-two" : ""}>
      {label}
      {key === "description" ? (
        <textarea required rows={4} value={value} onChange={(event) => onChange(key, event.target.value)} />
      ) : (
        <input
          required
          type={fieldType(key)}
          step={key === "lat" || key === "lng" ? "any" : undefined}
          value={value}
          onChange={(event) => onChange(key, event.target.value)}
        />
      )}
    </label>
  );
}

type CreateProps = { busy: boolean; onCreate: (input: BranchInput) => Promise<boolean> };

function BranchCreateForm({ busy, onCreate }: CreateProps) {
  const [input, setInput] = useState(BLANK_BRANCH);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (await onCreate(input)) setInput(afterCreate(input));
  }

  return (
    <form className="form-grid" onSubmit={(event) => void submit(event)}>
      {BRANCH_FIELDS.map((field) => (
        <BranchFieldInput
          key={field.key}
          field={field}
          value={input[field.key]}
          onChange={(key, value) => setInput({ ...input, [key]: value })}
        />
      ))}
      <button className="button" disabled={busy}>
        Create branch
      </button>
    </form>
  );
}

type EditorProps = {
  edit: BranchEdit;
  busy: boolean;
  onChange: (edit: BranchEdit) => void;
  onSave: () => void;
  onDiscard: () => void;
};

function BranchEditor({ edit, busy, onChange, onSave, onDiscard }: EditorProps) {
  return (
    <RecordEditor title="Edit branch" busy={busy} onSubmit={onSave} onDiscard={onDiscard}>
      <label>
        Branch name
        <input required value={edit.name} onChange={(event) => onChange({ ...edit, name: event.target.value })} />
      </label>
      <label>
        Description
        <textarea
          required
          rows={4}
          value={edit.description}
          onChange={(event) => onChange({ ...edit, description: event.target.value })}
        />
      </label>
    </RecordEditor>
  );
}

type TableProps = {
  branches: Branch[];
  onEdit: (branch: Branch) => void;
  onPublish: (branch: Branch) => void;
  onUnpublish: (branch: Branch) => void;
};

function BranchTable({ branches, onEdit, onPublish, onUnpublish }: TableProps) {
  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-label="Scrollable branches table">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>City</th>
            <th>Visibility</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {branches.map((branch) => {
            const hidden = branch.isPublished === false;
            const name = displayBrand(branch.name);
            return (
              <tr key={branch.id}>
                <td>{name}</td>
                <td>{branch.city}</td>
                <td>{hidden ? "Unpublished" : "Published"}</td>
                <td>
                  <button aria-label={`Edit ${name}`} onClick={() => onEdit(branch)}>
                    Edit
                  </button>
                  <button
                    aria-label={`${hidden ? "Publish" : "Unpublish"} ${name}`}
                    onClick={() => (hidden ? onPublish(branch) : onUnpublish(branch))}
                  >
                    {hidden ? "Publish" : "Unpublish"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type Props = {
  branches: Branch[];
  reload: (preferredSlug?: string) => Promise<void>;
  writes: Writes;
};

export function BranchesPanel({ branches, reload, writes }: Props) {
  const actions = useBranchActions(reload, writes);

  return (
    <div className="admin-panel">
      {actions.edit && (
        <BranchEditor
          key={actions.edit.id}
          edit={actions.edit}
          busy={writes.busy}
          onChange={actions.setEdit}
          onSave={() => void actions.saveEdit()}
          onDiscard={() => actions.setEdit(null)}
        />
      )}
      <h2>Add a branch</h2>
      <p>
        Add the property’s verified contact and location details. Existing branches can be updated
        or unpublished.
      </p>
      <BranchCreateForm busy={writes.busy} onCreate={actions.create} />
      <h3>Existing branches</h3>
      <BranchTable
        branches={branches}
        onEdit={({ id, name, description }) =>
          id && actions.setEdit({ id, name: displayBrand(name), description: description ?? "" })
        }
        onPublish={(branch) => void actions.publish(branch)}
        onUnpublish={(branch) => void actions.unpublish(branch)}
      />
    </div>
  );
}