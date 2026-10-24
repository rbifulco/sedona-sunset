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
import {createReviewYield} from './cooperative-yield.js';
import {measureStreamRepresentations} from './stream-estimates.js';
import {createReviewPreparation} from './materials.js';
const yieldTask=createReviewYield();
const identity={position:[0,0,0],rotation:[0,0,0],scale:[1,1,1]};
const registry=new SceneAssetRegistry(__REVIEW_BUILD__);
const {prepare,dispose:disposePreparation}=createReviewPreparation(yieldTask);
const phases=[]; const sources=[];
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
function register(id,name,roots,sourceRef,category){
 const bounds=new THREE.Box3();
 for(const root of roots){root.updateMatrixWorld(true);bounds.expandByObject(root,true);}
 const {triangles,instances,sceneBytes,detailBytes,sceneAttributes,detailAttributes}=measureStreamRepresentations(roots);
 const position=new THREE.Vector3(),quaternion=new THREE.Quaternion(),scale=new THREE.Vector3();roots[0].matrixWorld.decompose(position,quaternion,scale);const rotation=new THREE.Euler().setFromQuaternion(quaternion,'XYZ');const transform={position:position.toArray(),rotation:[rotation.x,rotation.y,rotation.z].map(THREE.MathUtils.radToDeg),scale:scale.toArray()};
 const center=bounds.getCenter(new THREE.Vector3()).toArray(),size=bounds.getSize(new THREE.Vector3()).toArray();
 sources.push({id,name,sourceRef,roots:roots.map(r=>r.name),triangles,instances,sceneBytes,detailBytes,bounds:{center,size}});
 registry.registerDeferred({actorId:id,assetId:id,name,sourceRef,category,parentAssemblyId:'sedona-world',transform,bounds:{center,size},tags:['authoritative-geometry','approximate-shading'],stream:{capability:SPATIAL_REVIEW_ASSET_STREAM_CAPABILITY,revision:__REVIEW_BUILD__+'-'+id,representations:[{id:'detail',purpose:'detail',revision:__REVIEW_BUILD__+'-'+id+'-detail',estimatedBytes:detailBytes,triangles,instances,attributes:detailAttributes,geometricError:0},{id:'overview',purpose:'overview',revision:__REVIEW_BUILD__+'-'+id+'-overview',estimatedBytes:sceneBytes,triangles,instances,attributes:sceneAttributes,geometricError:0}]},async produceRepresentation({signal,reportProgress}){reportProgress({phase:'generating',completed:0,total:roots.length});const result=await prepare(roots,signal);reportProgress({phase:'generating',completed:roots.length,total:roots.length});return result;}});
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
const teardown=()=>{detach();disposePreparation();};
addEventListener('pagehide',teardown,{once:true});
window.__sedonaReview={registry,sources,phases,stops,teardown};
document.querySelector('#status').textContent='Ready: '+sources.length+' source-derived actors, one World owner, and ten authored keyboard viewpoints.';
