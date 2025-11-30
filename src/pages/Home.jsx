import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Users, Lock } from 'lucide-react';

function Home() {
    const navigate = useNavigate();
    const [joinRoomId, setJoinRoomId] = useState('');
    const [createPassword, setCreatePassword] = useState('');
    const [joinPassword, setJoinPassword] = useState('');

    const handleCreateRoom = () => {
        const roomId = Math.random().toString(36).substring(2, 8);
        navigate(`/room/${roomId}`, { state: { password: createPassword } });
    };

    const handleJoinRoom = (e) => {
        e.preventDefault();
        if (joinRoomId.trim()) {
            navigate(`/room/${joinRoomId}`, { state: { password: joinPassword } });
        }
    };

    return (
        <div className="home">
            <div className="card-container" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <div className="card">
                    <h2><Monitor size={24} style={{ verticalAlign: 'middle' }} /> Create Room</h2>
                    <p>Share your screen with others</p>
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Lock size={16} />
                            <label>Set Password (Optional)</label>
                        </div>
                        <input
                            type="password"
                            placeholder="Enter password"
                            value={createPassword}
                            onChange={(e) => setCreatePassword(e.target.value)}
                            style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>
                    <button onClick={handleCreateRoom}>Create Room</button>
                </div>

                <div className="card">
                    <h2><Users size={24} style={{ verticalAlign: 'middle' }} /> Join Room</h2>
                    <p>View a shared screen</p>
                    <form onSubmit={handleJoinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Enter Room ID"
                            value={joinRoomId}
                            onChange={(e) => setJoinRoomId(e.target.value)}
                            required
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                        <input
                            type="password"
                            placeholder="Enter Room Password"
                            value={joinPassword}
                            onChange={(e) => setJoinPassword(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                        <button type="submit">Join Room</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Home;
