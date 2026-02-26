/**
 * @module @yoltra/devtools-protocol
 */

/**
 * Protocol version following semver.
 *
 * @remarks
 * Used during the {@link HandshakeRequest} to negotiate compatible features
 * between hub, stores, and extensions. The hub compares major versions and
 * rejects connections with an incompatible major version.
 *
 * @example
 * ```ts
 * import { PROTOCOL_VERSION } from '@yoltra/devtools-protocol';
 *
 * const handshake: HandshakeRequest = {
 *   type: 'HANDSHAKE_REQUEST',
 *   protocolVersion: PROTOCOL_VERSION,
 *   role: DevtoolsRole.STORE,
 *   // ...
 * };
 * ```
 *
 * @public
 */
export const PROTOCOL_VERSION = "0.1.0";
