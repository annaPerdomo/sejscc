import { GroupForm } from "../group-form";

export default function NewGroupPage() {
  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Add New Group</h1>
      <p className="mt-1 mb-8 text-stone">
        Give the group a name, add whatever details you have, and hit Save —
        you can always come back to fill in more.
      </p>
      <GroupForm />
    </div>
  );
}
