/**
 * Sidebar.jsx
 *
 * Navigation sidebar used by the legacy Layout component.
 *
 * Note: The links here point to the legacy /dashboard/* paths which are
 * preserved as redirect aliases in App.jsx. If the sidebar is re-adopted,
 * consider updating the hrefs to the canonical paths (e.g. /client-dashboard)
 * to avoid an extra redirect hop.
 *
 * The "Submit Feedback" link uses a static path (/feedback/new) that is not
 * yet a defined route — this is a placeholder for a future implementation.
 */

import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, UserCircle, Briefcase, FileText } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <LayoutDashboard className="sidebar-icon" size={24} />
        PO-FES
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        <NavLink to="/dashboard/client" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Briefcase size={20} />
          <span>Client Dashboard</span>
        </NavLink>

        {/* TODO: /feedback/new is not yet a defined route */}
        <NavLink to="/feedback/new" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={20} />
          <span>Submit Feedback</span>
        </NavLink>

        <NavLink to="/dashboard/teaching-staff" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Teaching Staff</span>
        </NavLink>

        <NavLink to="/dashboard/unit-coordinator" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BookOpen size={20} />
          <span>Unit Coordinator</span>
        </NavLink>

        <NavLink to="/dashboard/industry-liaison" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <UserCircle size={20} />
          <span>Industry Liaison</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
