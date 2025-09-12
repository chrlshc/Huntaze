import React from 'react'
import EnterpriseNav from '@/src/components/enterprise-nav'
import SecurityTrustCenter from '@/components/sections/SecurityTrustCenter'
import EnterpriseFooter from '@/components/sections/EnterpriseFooter'

export default function SecurityPage() {
  return (
    <>
      <EnterpriseNav />
      <SecurityTrustCenter />
      <EnterpriseFooter />
    </>
  )
}