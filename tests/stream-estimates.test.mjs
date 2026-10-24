import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {assetFromObject3DRoots,prepareAssetTransfer} from '@alterno-dev/spatial-review';
import {measureStreamRepresentations} from '../review/stream-estimates.js';
import {createReviewPreparation} from '../review/materials.js';

test('0.9.0 stream budgets cover shared RGBA/UV geometry and instanced colors in both profiles', async () => {
  const geometry=new THREE.BoxGeometry(1,2,3);
  geometry.setAttribute('color',new THREE.Uint8BufferAttribute(new Uint8Array(geometry.attributes.position.count*4).fill(128),4,true));
  const material=new THREE.MeshStandardMaterial({vertexColors:true,transparent:true});
  const mesh=new THREE.Mesh(geometry,material);
  const field=new THREE.InstancedMesh(geometry,material,1000);
  field.setColorAt(0,new THREE.Color(0.6,0.3,0.2));
  const sources=[mesh,field];
  const preparation=createReviewPreparation(async()=>{});
  const roots=await preparation.prepare(sources,new AbortController().signal);
  const estimate=measureStreamRepresentations(sources);
  assert.equal(estimate.triangles,12*1001);
  assert.equal(estimate.instances,1000);
  assert.equal(roots[0].geometry,roots[1].geometry,'shared geometry stays shared');
  assert.notEqual(roots[0].material,roots[1].material,'existing per-renderable material targets stay independent');
  const legacy=sources.map(source=>{const copy=source.clone();copy.geometry=source.geometry.clone();copy.material=new THREE.MeshStandardMaterial({name:(source.material.name||source.name)+' — review shading approximation'});return copy;});
  const ids=roots=>{const a=assetFromObject3DRoots(roots,'Sample','src/sample.js',{assetId:'sample'});return {nodes:a.nodes.map(n=>n.id),materials:a.materials.map(m=>m.id),links:a.nodes.map(n=>n.materialIds)};};
  assert.deepEqual(ids(roots),ids(legacy),'component and material feedback IDs survive resource sharing');
  assert.ok(estimate.sceneBytes<estimate.detailBytes);
  assert.ok(estimate.sceneAttributes.includes('uv'));
  assert.ok(estimate.sceneAttributes.includes('color'));
  for(const [profile,budget] of [['scene',estimate.sceneBytes],['review',estimate.detailBytes]]){
    const asset=assetFromObject3DRoots(roots,'Sample','src/sample.js',{assetId:'sample',profile,geometryEncoding:'typed'});
    const transfer=prepareAssetTransfer(asset,64*1024*1024,{typedInstances:true});
    assert.ok(transfer.bytes<=budget,`${profile} transfer ${transfer.bytes} exceeds ${budget}`);
    assert.equal(asset.geometries.length,1,'one geometry per shared design');
    assert.equal(Boolean(transfer.asset.geometries[0].geometry.normals),profile==='review');
    assert.ok(transfer.asset.geometries[0].geometry.uvs);
    assert.equal(transfer.asset.geometries[0].geometry.colors.length,geometry.attributes.position.count*4);
    assert.ok(Math.abs(transfer.asset.geometries[0].geometry.colors[0]-128/255)<1e-6);
  }
  preparation.dispose();
});

test('capture keeps shader masks untinted and preserves source maps without ordinary mutations', async () => {
  const geometry=new THREE.BoxGeometry();
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*3).fill(0.4),3));
  const texture=new THREE.Texture();
  const maskMaterial=new THREE.MeshStandardMaterial({map:texture,vertexColors:false});
  const coloredMaterial=new THREE.MeshStandardMaterial({map:texture,vertexColors:true});
  const preparation=createReviewPreparation(async()=>{});
  const [mask,colored]=await preparation.prepare([new THREE.Mesh(geometry,maskMaterial),new THREE.Mesh(geometry,coloredMaterial)],new AbortController().signal);
  assert.equal(mask.material.vertexColors,false);
  assert.equal(colored.material.vertexColors,true);
  assert.equal(mask.geometry,colored.geometry);
  assert.equal(mask.material.map,texture);
  assert.equal(colored.material.map,texture);
  assert.equal(maskMaterial.vertexColors,false);
  assert.equal(geometry.attributes.color.count,geometry.attributes.position.count);
  preparation.dispose();
});
