import React from 'react';

const styles = {
  app: {
    position: 'relative',
    height: '100vh',
  },
  content: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    color: '#000000', // Updated to black
    zIndex: 2,
  },
  heading: {
    fontSize: '3em',
    marginBottom: '20px',
  },
  paragraph: {
    fontSize: '1.5em',
    marginBottom: '40px',
  },
};

export default function Home() {
  return (
    <div style={styles.app}>
      <div style={styles.content}>
        <h1 style={styles.heading}>FRC Dataset Colab</h1>
        <p style={styles.paragraph}>Allows for collaboration between FRC teams on a giant on object detection dataset!</p>
      </div>
    </div>
  );
}
