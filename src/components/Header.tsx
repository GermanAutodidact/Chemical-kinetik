/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const Header: React.FC = () => {
  return (
    <header>
      <a href="#" className="brand">
        <span className="mark">P</span> PEA{' '}
        <span className="subbrand">/ KINETIK &amp; EVIDENZ</span>
      </a>
      <span className="date">Stand 03.10.2026</span>
    </header>
  );
};
