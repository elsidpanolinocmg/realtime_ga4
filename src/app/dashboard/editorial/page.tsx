import { Suspense } from "react";
import EditorialPageClient from './EditorialClient'

const EditorialPage = () => {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <EditorialPageClient />
    </Suspense>
  )
}

export default EditorialPage