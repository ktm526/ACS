// src/MapEditor/RobotMapList.js

import React, { useState } from 'react';
import SavedMapList from './SavedMapList';
import styles from './RobotMapList.module.css';

const RobotMapList = ({ robotDataList }) => {
  const [expandedUID, setExpandedUID] = useState(null);

  const handleExpand = (uid) => {
    setExpandedUID(expandedUID === uid ? null : uid);
  };

  return (
    <div className={styles.robotListContainer}>
      {robotDataList.map((robot) => (
        <SavedMapList
          key={robot.uid}
          robot={robot}
          isExpanded={expandedUID === robot.uid}
          onExpand={() => handleExpand(robot.uid)}
        />
      ))}
    </div>
  );
};

export default RobotMapList;
