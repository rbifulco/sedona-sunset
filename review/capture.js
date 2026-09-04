import * as THREE from 'three';
import {SceneAssetRegistry,attachSceneAssetRegistryBridge,SPATIAL_REVIEW_ASSET_STREAM_CAPABILITY} from '@alterno-dev/spatial-review';
import {WashPath} from '../src/path.js';
import {Terrain,buildTerrainMesh,makeTerrainMaterial,applyScour} from '../src/terrain.js';
import {buildWalls,buildDistantButtes,buildTalus,makeRockMaterial} from '../src/rock.js';
import {buildScatter} from '../src/scatter.js';
import {buildFarRidges} from '../src/farridge.js';
import {buildJuniper} from '../src/juniper.js';
import {buildVegetation} from '../src/vegetation.js';
import {makeDirt,makeSand,makeRock,makeGrit,makeClastSurface,makeMacro,makeVariance,makeCracks} from '../src/textures.js';
import {SPOTS} from './source-spots.js';
const yieldTask=()=>new Promise(r=>setTimeout(r,0));
const identity={position:[0,0,0],rotation:[0,0,0],scale:[1,1,1]};
const registry=new SceneAssetRegistry(__REVIEW_BUILD__);
const prepared=new Map();const alphaMaps=new Map();const ownedTextures=new Set();
const phases=[]; const sources=[]; const ownedMaterials=new Set();const ownedGeometries=new Set();
async function phase(name,build){document.querySelector('#status').textContent=name;await yieldTask();const t=performance.now();const v=build();phases.push({name,ms:performance.now()-t});return v;}
const tex={};
for(const [name,make,n]of [['dirt',makeDirt,1024],['sand',makeSand,512],['rock',makeRock,1024],['grit',makeGrit,256],['clast',makeClastSurface,512],['macro',makeMacro,512],['variance',makeVariance,512],['crack',makeCracks,512]])tex[name]=await phase('Generating '+name,()=>make(n));
const path=new WashPath(),terrain=new Terrain(path);
const ground=await phase('Building wash terrain',()=>buildTerrainMesh(terrain,makeTerrainMaterial(tex)));
const rockMat=makeRockMaterial(tex);
const walls=await phase('Building canyon walls',()=>buildWalls(path,terrain,rockMat));
const buttes=await phase('Building distant buttes',()=>buildDistantButtes(terrain,rockMat));
const talus=await phase('Building talus',()=>buildTalus(path,terrain,rockMat));
const ridges=await phase('Building far ridges',()=>buildFarRidges(terrain,path));
const stones=await phase('Building stone scatter',()=>buildScatter(terrain,tex));
applyScour(ground,terrain);
const juniper=await phase('Building hero juniper',()=>buildJuniper(terrain,tex));
const vegetation=await phase('Building vegetation',()=>buildVegetation(path,terrain,[...walls,...buttes,...talus]));
registry.registerAssembly({assemblyId:'sedona-world',name:'Sedona wash and surroundings',sourceRef:'src/main.js#scene',localTransform:identity});
// All geometry, attributes and instance placements originate in the source factories.
// Standard UV maps survive unchanged. Custom rock/terrain projection receives a
// declared dominant-axis UV approximation using the original generated albedo.
function alphaFor(texture,threshold){
 const key=texture.uuid+':'+threshold;if(alphaMaps.has(key))return alphaMaps.get(key);
 const image=texture.image,canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const context=canvas.getContext('2d');
 let data;if(image.data)data=image.data;else{context.drawImage(image,0,0);data=context.getImageData(0,0,image.width,image.height).data;}
 const pixels=new Uint8Array(image.width*image.height*4);for(let i=0;i<pixels.length;i+=4){pixels[i]=pixels[i+1]=pixels[i+2]=data[i+3]/255>=threshold?255:0;pixels[i+3]=255;}
 const map=new THREE.DataTexture(pixels,image.width,image.height,THREE.RGBAFormat);map.wrapS=texture.wrapS;map.wrapT=texture.wrapT;map.flipY=texture.flipY;map.repeat.copy(texture.repeat);map.needsUpdate=true;map.name='Source alpha threshold '+threshold;alphaMaps.set(key,map);ownedTextures.add(map);return map;
}
async function materialFor(mesh,geo,signal){
 const m=mesh.material,u=m.userData?.uniforms||{};
 const color=u.uIron?.value || m.color || new THREE.Color(0xb79068);
 const out=new THREE.MeshStandardMaterial({name:(m.name||mesh.name)+' — review shading approximation',color,roughness:m.roughness??1,metalness:m.metalness??0,side:m.side,transparent:m.transparent,opacity:m.opacity,alphaTest:m.alphaTest||0,vertexColors:!!geo.attributes.color});
 for(const slot of ['map','normalMap','roughnessMap','metalnessMap','aoMap','alphaMap','emissiveMap'])if(m[slot]&&geo.attributes.uv)out[slot]=m[slot];
 if(!out.map&&(u.uRockA||u.uDirtA)){
  out.map=(u.uRockA&&u.uIron?u.uRockA:u.uDirtA||u.uRockA).value;
  const p=geo.attributes.position,n=geo.attributes.normal,uv=new Float32Array(p.count*2),v=new THREE.Vector3();
  for(let i=0;i<p.count;i++){if(i%8192===0){signal.throwIfAborted();await yieldTask();}v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);let a=0,b=2;if(u.uIron&&n){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));if(nx>ny&&nx>nz){a=2;b=1;}else if(nz>ny){a=0;b=1;}}const scale=u.uIron?0.0715:0.3846;uv[i*2]=v.getComponent(a)*scale;uv[i*2+1]=v.getComponent(b)*scale;}
  geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
 }
 if(m.alphaTest>0&&out.map){out.alphaMap=alphaFor(out.map,m.alphaTest);out.transparent=true;}
 if(m.normalScale)out.normalScale.copy(m.normalScale);
 ownedMaterials.add(out);return out;
}
async function prepare(roots,signal){
 if(prepared.has(roots))return prepared.get(roots);
 const result=[],allocated=[];
 try{
  for(const source of roots){
   signal.throwIfAborted();await yieldTask();source.updateMatrixWorld(true);const clone=source.clone(true);result.push(clone);
   const originals=[],clones=[];source.traverse(o=>originals.push(o));clone.traverse(o=>clones.push(o));
   for(let i=0;i<clones.length;i++){const o=clones[i],src=originals[i];if(!o.isMesh)continue;
    signal.throwIfAborted();await yieldTask();o.geometry=src.geometry.clone();ownedGeometries.add(o.geometry);allocated.push({geometry:o.geometry});
    o.material=await materialFor(src,o.geometry,signal);allocated.at(-1).material=o.material;
   }
  }
  signal.throwIfAborted();prepared.set(roots,result);return result;
 }catch(error){for(const item of allocated){item.geometry.dispose();ownedGeometries.delete(item.geometry);if(item.material){item.material.dispose();ownedMaterials.delete(item.material);}}throw error;}
}
function register(id,name,roots,sourceRef,category){
 const bounds=new THREE.Box3();let triangles=0,bytes=0;
 for(const root of roots){root.updateMatrixWorld(true);bounds.expandByObject(root,true);root.traverse(o=>{if(o.geometry){const g=o.geometry;triangles+=(g.index?g.index.count:g.attributes.position.count)/3*(o.count||1);bytes+=Object.values(g.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(g.index?.array.byteLength||0)+(o.instanceMatrix?.array.byteLength||0);}});}
 const position=new THREE.Vector3(),quaternion=new THREE.Quaternion(),scale=new THREE.Vector3();roots[0].matrixWorld.decompose(position,quaternion,scale);const rotation=new THREE.Euler().setFromQuaternion(quaternion,'XYZ');const transform={position:position.toArray(),rotation:[rotation.x,rotation.y,rotation.z].map(THREE.MathUtils.radToDeg),scale:scale.toArray()};
 const center=bounds.getCenter(new THREE.Vector3()).toArray(),size=bounds.getSize(new THREE.Vector3()).toArray();
 sources.push({id,name,sourceRef,roots:roots.map(r=>r.name),triangles,bytes,bounds:{center,size}});
 registry.registerDeferred({actorId:id,assetId:id,name,sourceRef,category,parentAssemblyId:'sedona-world',transform,bounds:{center,size},tags:['authoritative-geometry','approximate-shading'],stream:{capability:SPATIAL_REVIEW_ASSET_STREAM_CAPABILITY,revision:__REVIEW_BUILD__+'-'+id,representations:[{id:'detail',purpose:'detail',revision:__REVIEW_BUILD__+'-'+id+'-detail',estimatedBytes:Math.ceil(bytes*2+65536),triangles,attributes:['position','normal','uv'],geometricError:0},{id:'overview',purpose:'overview',revision:__REVIEW_BUILD__+'-'+id+'-overview',estimatedBytes:Math.ceil(bytes*2+65536),triangles,attributes:['position','normal','uv'],geometricError:0}]},async produceRepresentation({signal,reportProgress}){reportProgress({phase:'generating',completed:0,total:roots.length});const result=await prepare(roots,signal);reportProgress({phase:'generating',completed:roots.length,total:roots.length});return result;}});
}
register('wash-terrain','Wash terrain',[ground],'src/terrain.js#buildTerrainMesh','Terrain');
for(const m of walls)register('canyon-'+m.name,m.name,[m],'src/rock.js#buildWalls','Canyon');
for(const m of buttes)register('formation-'+m.name,m.name,[m],'src/rock.js#BUTTES','Landforms');
register('canyon-talus','Canyon talus',talus,'src/rock.js#buildTalus','Canyon');
register('far-ridges','Far ridgelines',[ridges],'src/farridge.js#buildFarRidges','Landforms');
register('wash-stones','Wash stone distribution',stones,'src/scatter.js#buildScatter','Stones');
register('hero-juniper','Hero juniper',juniper,'src/juniper.js#buildJuniper','Vegetation');
register('wash-vegetation','Wash vegetation distribution',vegetation,'src/vegetation.js#buildVegetation','Vegetation');
// Keyboard jumps are instant discrete viewpoints, not a timed camera rail.
// Export the authored stops without inventing interpolation or editable splines.
const names=['Wash entrance','Mid wash','Hero juniper','The bend','Sun gap','Second bend','Long straight','Upper wash','Far end','Start'];
const stops=SPOTS.map((s,i)=>{const p=path.posAt(s.d);p.y=terrain.heightAtQ(p.x,p.z,path.atZ(p.z))+1.65;const direction=new THREE.Vector3(0,0,-1).applyEuler(new THREE.Euler(s.pitch*Math.PI/180,-s.yaw*Math.PI/180,0,'YXZ'));return{id:s.key,name:names[i],camera:p.toArray(),target:p.clone().add(direction).toArray(),fov:58,sourceRef:'src/main.js#SPOTS'};});
registry.registerNavigationSequence({id:'wash-keyboard-viewpoints',name:'Keyboard viewpoints (instant jumps)',sourceRef:'src/main.js#SPOTS',stops,segments:[]});
const detach=attachSceneAssetRegistryBridge(registry,{allowOfficialEditor:true,allowLoopbackPeers:true,allowedOrigins:[],maxGeometryBytes:64*1024*1024,maxConcurrentAssetRequests:1,maxInFlightBytes:64*1024*1024,maxQueuedAssetRequests:24});
const teardown=()=>{detach();for(const m of ownedMaterials)m.dispose();for(const g of ownedGeometries)g.dispose();ownedMaterials.clear();ownedGeometries.clear();prepared.clear();for(const t of ownedTextures)t.dispose();ownedTextures.clear();alphaMaps.clear();};
addEventListener('pagehide',teardown,{once:true});
window.__sedonaReview={registry,sources,phases,stops,teardown};
document.querySelector('#status').textContent='Ready: '+sources.length+' source-derived actors, one World owner, and ten authored keyboard viewpoints.';
