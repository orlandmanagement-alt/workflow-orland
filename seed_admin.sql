INSERT INTO users (id, email, full_name, password_hash, role, status, created_at)
VALUES (
    'usr-admin-god',
    'admin@orlandmanagement.com',
    'God Mode Admin',
    'c047813ae736c952da389e4790630012ab62c75dffa96cdc1ef685721caa6aac',
    'super_admin',
    'active',
    CAST(strftime('%s', 'now') AS INTEGER)
)
ON CONFLICT(id) DO UPDATE SET 
    password_hash = excluded.password_hash, 
    role = excluded.role, 
    status = 'active';
