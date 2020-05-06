/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable import/first */

import * as React from 'react';
import {unstable_block as block} from 'react';

// Client

// TODO: delete this wrapper.

import ClientProfileNav from '../client/ProfileNav';

function ProfileNav(props, _) {
  return <ClientProfileNav {...props} />;
}

export default block(ProfileNav);
