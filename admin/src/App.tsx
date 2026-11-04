import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createBrowserRouter, Navigate, Route, RouterProvider, Routes } from 'react-router';
import { Layout } from '@/components/layout';
import { ConfirmHost, ToastHost } from '@/components/ui';
import { api } from '@/lib/api';
import type { Me } from '@/lib/types';
import { AccountPage } from '@/pages/account';
import { DashboardPage } from '@/pages/dashboard';
import { EducationsPage } from '@/pages/educations';
import { ExperiencesPage } from '@/pages/experiences';
import { InfoPage } from '@/pages/info';
import { ForcePasswordPage, LoginPage } from '@/pages/login';
import { MessagesPage } from '@/pages/messages';
import { ProjectFormPage } from '@/pages/project-form';
import { ProjectsPage } from '@/pages/projects';
import { SkillsPage } from '@/pages/skills';
import { useAuth } from '@/store/auth';

/** Relit le compte au démarrage (et déconnecte si la session n'est plus valable). */
function useSyncMe() {
  const token = useAuth((s) => s.token);
  const setMe = useAuth((s) => s.setMe);
  const q = useQuery({ queryKey: ['me', token], queryFn: () => api<Me>('/admin/auth/me'), enabled: !!token, staleTime: 60_000 });
  useEffect(() => { if (q.data) setMe(q.data); }, [q.data, setMe]);
}

function Protected() {
  useSyncMe();
  const me = useAuth((s) => s.me);
  if (me?.mustChangePassword) return <ForcePasswordPage />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="projets" element={<ProjectsPage />} />
        <Route path="projets/nouveau" element={<ProjectFormPage />} />
        <Route path="projets/:id" element={<ProjectFormPage />} />
        <Route path="competences" element={<SkillsPage />} />
        <Route path="parcours" element={<ExperiencesPage />} />
        <Route path="formation" element={<EducationsPage />} />
        <Route path="profil" element={<InfoPage />} />
        <Route path="compte" element={<AccountPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function Root() {
  const token = useAuth((s) => s.token);
  return (
    <>
      {token ? <Protected /> : <LoginPage />}
      <ConfirmHost />
      <ToastHost />
    </>
  );
}

// Routeur « data » : nécessaire pour bloquer la navigation quand un formulaire n'est pas enregistré.
const router = createBrowserRouter([{ path: '*', element: <Root /> }]);

export default function App() {
  return <RouterProvider router={router} />;
}
