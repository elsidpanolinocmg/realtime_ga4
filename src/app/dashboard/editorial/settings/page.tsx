import { Suspense } from "react";
import EditorialSettingsClient from './SettingsClient'


const EditorialSettingsPage = () => {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <EditorialSettingsClient />
    </Suspense>
  )
}

export default EditorialSettingsPage