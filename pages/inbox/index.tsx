import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/messages',
      permanent: false,
    },
  }
}

export default function InboxRedirect() {
  return null
}

