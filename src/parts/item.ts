import itemVt from '../glsl/item.vert';
import itemFg from '../glsl/item.frag';
import { MyObject3D } from "../webgl/myObject3D";
import { Mesh } from 'three/src/objects/Mesh';
import { Util } from "../libs/util";
import { MeshBasicMaterial } from 'three/src/materials/MeshBasicMaterial';
import { CircleGeometry } from 'three/src/geometries/CircleGeometry';
import { Func } from "../core/func";
import { CatmullRomCurve3 } from "three/src/extras/curves/CatmullRomCurve3";
import { TubeGeometry } from "three/src/geometries/TubeGeometry";
import { Vector3 } from "three/src/math/Vector3";
import { Color } from "three/src/math/Color";
import { Scroller } from "../core/scroller";
import { BufferAttribute } from "three/src/core/BufferAttribute";
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial';
import { HSL } from '../libs/hsl';

export class Item extends MyObject3D {

  private _id:number;
  private _line:Mesh;
  private _edge:Array<Mesh> = [];

  constructor(opt: any) {
    super()

    this._id = opt.id;

    for(let i = 0; i < 2; i++) {
      const col = new Color();
      const hsl = new HSL();
      hsl.h = [0,1][i];
      hsl.s = 1;
      hsl.l = 0.5;
      col.setHSL(hsl.h, hsl.s, hsl.l);

      const edge = new Mesh(
        new CircleGeometry(0.5, 64),
        new MeshBasicMaterial({
          depthTest: false,
          color: col,
        })
      );
      this.add(edge);
      this._edge.push(edge);
    }

    this._line = new Mesh(
      this._makeLineGeo(),
      new ShaderMaterial({
        vertexShader:itemVt,
        fragmentShader:itemFg,
        transparent:true,
        depthTest:false,
        uniforms:{
          alpha:{value:1},
        }
      })
    );
    this.add(this._line);
  }


  protected _update(): void {
    super._update();

    const sw = Func.instance.sw();
    const sh = Func.instance.sh();

    if(this._id == 0) {
      this.position.x = sw * 0.45;
    }

    if(this._id == 1) {
      this.position.x = -sw * 0.45;
      this.scale.y = -1;
    }

    if(this._id == 2) {
      this.position.y = sh * 0.45;
      // this.scale.y = -1;
    }

    if(this._id == 3) {
      this.position.y = -sh * 0.45;
      this.scale.x = -1;
    }
  }


  public setRate(r:number):void {
    this._line.geometry.dispose();
    this._line.geometry = this._makeLineGeo(r);
  }


  // ---------------------------------
  //
  // ---------------------------------
  private _makeLineGeo(r:number = 0): TubeGeometry {
    const arr = [];

    const sw = Func.instance.sw();
    const sh = Func.instance.sh();

    const width = Func.instance.val(4, 10);
    let it = sh * Func.instance.val(0.0025, 0.005);
    let i = 0;
    const sp = Math.abs(~~(Scroller.instance.power.y)) * 0.025;
    it *= sp;

    const radius = sw * Func.instance.val(0.02, 0.01) * sp;
    const fineness = 10;
    const ang = 360;
    let startY = Util.instance.map(r, sh * 0.45, -sh * 0.45 + it * (ang / fineness), 0, 1);

    if(this._id >= 2) {
      startY = Util.instance.map(r, -sw * 0.45 + it * (ang / fineness), sw * 0.45, 0, 1);
    }

    while (i <= ang) {
      const radian = Util.instance.radian((Util.instance.mix(0, 360 * 3, r)) + i);
      let v:Vector3;
      if(this._id <= 1) {
        v = new Vector3(
          Math.sin(radian) * radius,
          startY - arr.length * it,
          0
        );
      } else {
        v = new Vector3(
          startY - arr.length * it,
          Math.sin(radian) * radius,
          0
        );
      }

      arr.push(v);
      i += fineness;
    }

    const edgeSize = width * 1.75;
    this._edge[0].scale.set(edgeSize, edgeSize, 1);
    this._edge[1].scale.set(edgeSize, edgeSize, 1);

    this._edge[0].position.x = arr[0].x;
    this._edge[0].position.y = arr[0].y;

    this._edge[1].position.x = arr[arr.length - 1].x;
    this._edge[1].position.y = arr[arr.length - 1].y;

    const sampleClosedSpline = new CatmullRomCurve3(arr, false);
    const tube = new TubeGeometry(sampleClosedSpline, 64, width, 3, false);

    const num = tube.attributes.position.count;
    const pos = tube.attributes.position.array;
    const order = new Float32Array(num * 3);
    i = 0;
    while (i < num) {
      if(this._id <= 1) {
        order[i * 3 + 0] = Util.instance.map(pos[i * 3 + 1], 0, 1, startY - it * (ang / fineness) + it * 2, startY - it * 2);
      } else {
        order[i * 3 + 0] = Util.instance.map(pos[i * 3 + 0], 0, 1, startY - it * (ang / fineness) + it * 2, startY - it * 2);
      }

      order[i * 3 + 1] = 0;
      order[i * 3 + 2] = 0;
      i++;
    }
    tube.setAttribute("order", new BufferAttribute(order, 3));

    return tube;
  }
}