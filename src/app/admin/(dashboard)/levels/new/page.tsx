import { AdminPageWidth } from "@/components/admin/admin-page-width";
import { LevelForm } from "../level-form";

export default function NewLevelPage() {
  return (
    <AdminPageWidth>
      <h1 className="font-display text-3xl text-ink">Add a Class Level</h1>
      <p className="mt-1 mb-8 text-stone">
        Fill in the details below, then choose Save.
      </p>
      <LevelForm />
    </AdminPageWidth>
  );
}
