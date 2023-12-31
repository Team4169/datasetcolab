import React from "react";

const AboutUs = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h2>About Us</h2>
      <p>
        Dataset Colab presents a collaborative large-scale object-detection
        dataset for FRC teams. Users contribute images and annotations,
        collectively forming an expansive dataset. Access to this dataset
        enhances autonomous performance in advanced object-detection systems.
      </p>
      <p>
        Dataset Colab was developed by Warrior Robotics (FRC Team 4169). Warrior
        Robotics consisting of 35 students from Lincoln Sudbury Regional High
        School and is entirely student-led. Over the past two years we have
        developed a comprehensive object detection system that allows our robot
        to quickly pick up game objects. Dataset Colab was developed in response
        to the poor preformance of our object detection models because of small
        datasets.
      </p>
      <h3>Contact Information</h3>
      <p>For any questions or inquiries, please contact:</p>
      <ul>
        <li>
          Arjun Goray -{" "}
          <a href="mailto:goraya25@lsrhs.net">goraya25@lsrhs.net</a>
        </li>
        <li>
          Sean Mabli -{" "}
          <a href="mailto:mablis25@lsrhs.net">mablis25@lsrhs.net</a>
        </li>
      </ul>
    </div>
  );
};

export default AboutUs;
