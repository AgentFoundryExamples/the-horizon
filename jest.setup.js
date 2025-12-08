// Copyright 2025 John Brosnihan
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import '@testing-library/jest-dom'
import React from 'react';

// Polyfill Web Crypto API for Node.js test environment
const { webcrypto } = require('crypto');
const { TextEncoder, TextDecoder } = require('util');

// Set up Web Crypto API polyfill for test environment
if (typeof global !== 'undefined') {
  // Polyfill crypto only if it's not already available or not the native implementation
  if (!global.crypto || !global.crypto.subtle) {
    global.crypto = webcrypto;
  }
  
  if (!global.TextEncoder) {
    global.TextEncoder = TextEncoder;
  }
  if (!global.TextDecoder) {
    global.TextDecoder = TextDecoder;
  }
}

// Mock react-markdown to avoid ESM issues in tests
jest.mock('react-markdown', () => {
  return {
    __esModule: true,
    default: (props) => {
      return React.createElement('div', {}, props.children);
    },
  };
});

// Mock remark-gfm
jest.mock('remark-gfm', () => {
  return {
    __esModule: true,
    default: () => {},
  };
});

