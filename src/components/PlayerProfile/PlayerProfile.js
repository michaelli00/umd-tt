import Container from 'react-bootstrap/Container';
import './PlayerProfile.css';

function PlayerProfile() {
  const data = {
    playerID: 1,
    name: 'Michael',
    rating: 2000,
    active: false,
  }

  return (
    <Container className="PlayerProfile">
      <h1> {data.name} </h1>
      <div className="player-info"><b>Player ID</b>: &nbsp; {data.playerID} </div>
      <div className="player-info"><b>Player Rating</b>: &nbsp; {data.rating} </div>
      <div className="player-info"><b>Player Active</b>: &nbsp; {data.active ? 'Active' : 'Inactive'} </div>
    </Container>
  );
}

export default PlayerProfile;
