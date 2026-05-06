import { Bell, User } from 'lucide-react';

const Header = () => {
  return (
    <header className="header">
      <div className="header-search">
        {/* Placeholder for future search or breadcrumbs */}
      </div>
      <div className="header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button className="btn btn-outline" style={{ padding: '0.5rem', border: 'none' }}>
          <Bell size={20} className="text-muted" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-100)',
            color: 'var(--color-primary-700)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <User size={20} />
          </div>
          <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Current User</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
