const run = async () => {
    try {
        // 1. Login to get token
        const loginRes = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@univ.dz', password: 'admin' })
        });
        const loginData = await loginRes.json();
        if (!loginData.token) {
            console.error('Login failed', loginData);
            return;
        }

        // 2. Try to create a level
        const res = await fetch('http://localhost:5000/api/classes/levels', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginData.token}`
            },
            body: JSON.stringify({ name: 'L1 Test', department_id: 1 })
        });
        const text = await res.text();
        console.log('Status:', res.status);
        console.log('Response:', text);
    } catch (err) {
        console.error('Fetch error:', err.message);
    }
};

run();
