import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const AboutUs = () => {
  return (
    <Container className="mt-5">
      <Row>
        <Col>
          <h2>About Us</h2>
          <p>
            We, as members of FRC Team 4169, the Warrior Robotics, are dedicated to creating a collaborative large object-detection dataset that empowers FRC teams to contribute their images and annotations. Our mission is to build a comprehensive and high-quality dataset for advancing object-detection systems in the robotics community.
          </p>
          <p>
            All contributors to the dataset gain exclusive access to download the extensive collection for use in their own object-detection projects. Your participation fuels the growth and success of our shared knowledge base.
          </p>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <h3>Contact Information</h3>
          <p>
            For any questions or inquiries, please contact:
          </p>
          <ul>
            <li>Arjun Goray - <a href="mailto:goraya25@lsrhs.net">goraya25@lsrhs.net</a></li>
            <li>Sean Mabli - <a href="mailto:mablis25@lsrhs.net">mablis25@lsrhs.net</a></li>
          </ul>
        </Col>
      </Row>
    </Container>
  );
};

export default AboutUs;
