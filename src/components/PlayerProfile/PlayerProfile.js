import Container from 'react-bootstrap/Container';

function PlayerProfile() {
  const data = {
    playerID: 1,
    name: 'Michael',
    rating: 2000,
    active: false,
  }

  return (
    <Container>
      {data.playerID}
      {data.name}
      {data.rating}
      {data.active}
    </Container>
  );
}

export default PlayerProfile;
