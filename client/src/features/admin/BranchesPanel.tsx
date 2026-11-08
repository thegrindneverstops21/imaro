import { useDraftGuard, useNavigationGuard } from "../../components/ui/NavigationGuard";
import { Form } from "../../components/ui/Form";
import { useState } from "react";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "../../components/ui";
import { displayBrand } from "../../lib/format";
import type { Branch } from "../../types/api";
import { BranchCreateForm } from "./BranchCreateForm";
import type { Writes } from "./useAdminWrites";
import { useBranchActions, type BranchEdit } from "./useBranchActions";

type EditorProps = {
  edit: BranchEdit;
  busy: boolean;
  onChange: (edit: BranchEdit) => void;
  onSave: () => void;
  onDiscard: () => void;
};

function BranchEditor({ edit, busy, onChange, onSave, onDiscard }: EditorProps) {
  useDraftGuard(edit);
  const { confirmLeave } = useNavigationGuard();
  async function discard() { if (!busy && await confirmLeave()) onDiscard(); }
  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open) void discard();
      }}
      placement="center" scrollBehavior="inside" classNames={{ base: "admin-modal" }}
      size="lg"
    >
      <ModalContent>
        <ModalHeader>
          <div>
            <h2>Edit branch</h2>
            <p>Update the property’s public details.</p>
          </div>
        </ModalHeader>
        <ModalBody className="admin-modal-body">
          <Form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              onSave();
            }}
          >
            <label>
              Branch name
              <input required value={edit.name} onChange={(event) => onChange({ ...edit, name: event.target.value })} />
            </label>
            <label className="span-two">
              Description
              <textarea
                required
                rows={4}
                value={edit.description}
                onChange={(event) => onChange({ ...edit, description: event.target.value })}
              />
            </label>
            <button className="button" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </button>
          </Form>
        </ModalBody>
        <ModalFooter>
          <button type="button" className="button button-quiet" onClick={() => void discard()}>
            Cancel
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
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
  onCreated: (slug: string) => void;
};

export function BranchesPanel({ branches, reload, writes, onCreated }: Props) {
  const { confirmLeave, clear } = useNavigationGuard();
  const closeCreate = async () => { if (!writes.busy && await confirmLeave()) setCreating(false); };
  const actions = useBranchActions(reload, writes);
  const [creating, setCreating] = useState(false);

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
      <div className="admin-panel-head">
        <h2>Branches</h2>
        <button className="button" type="button" onClick={() => setCreating(true)}>
          Add branch
        </button>
      </div>
      <Modal
        isOpen={creating}
        isDismissable={false}
        onOpenChange={(open) => { if (!open) void closeCreate(); }}
        placement="center" scrollBehavior="inside" classNames={{ base: "admin-modal" }}
        size="2xl"
        shouldCloseOnInteractOutside={(element) =>
          !element.closest(".modern-select-list, .modern-calendar")
        }
      >
        <ModalContent>
          <ModalHeader>
            <div>
              <h2>Add branch</h2>
              <p>Add contact details you have checked, then set up rooms and prices.</p>
            </div>
          </ModalHeader>
          <ModalBody className="admin-modal-body">
            <BranchCreateForm
              key={String(creating)}
              busy={writes.busy}
              onCreate={async (input) => {
                const created = await actions.create(input);
                if (created) { clear(); setCreating(false); onCreated(input.slug.trim()); }
                return created;
              }}
            />
          </ModalBody>
          <ModalFooter>
            <button type="button" className="button button-quiet" onClick={() => void closeCreate()}>
              Cancel
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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
