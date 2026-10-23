import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {assetFromObject3DRoots,prepareAssetTransfer} from '@alterno-dev/spatial-review';
import {measureStreamRepresentations} from '../review/stream-estimates.js';

test('stream estimates cover capture-cloned geometry and instanced SDK transfers', () => {
  const geometry=new THREE.BoxGeometry(1,2,3);
  const material=new THREE.MeshStandardMaterial();
  const mesh=new THREE.Mesh(geometry,material);
  const field=new THREE.InstancedMesh(geometry,material,1000);
  // Source roots reuse geometry; capture.js clones it once per renderable.
  const sources=[mesh,field];
  const roots=sources.map(source=>{const copy=source.clone();copy.geometry=source.geometry.clone();return copy});
  const estimate=measureStreamRepresentations(sources);
  assert.equal(estimate.triangles,12*1001);
  assert.equal(estimate.instances,1000);
  assert.ok(estimate.sceneBytes<estimate.detailBytes);

  for(const [profile,budget] of [['scene',estimate.sceneBytes],['review',estimate.detailBytes]]){
    const asset=assetFromObject3DRoots(roots,'Sample','src/sample.js',{assetId:'sample',profile,geometryEncoding:'typed'});
    const transfer=prepareAssetTransfer(asset,64*1024*1024,{typedInstances:true});
    assert.ok(transfer.bytes<=budget,`${profile} transfer ${transfer.bytes} exceeds ${budget}`);
    assert.equal(Boolean(transfer.asset.geometries[0].geometry.normals),profile==='review');
    assert.equal(Boolean(transfer.asset.geometries[0].geometry.uvs),profile==='review');
  }
});
