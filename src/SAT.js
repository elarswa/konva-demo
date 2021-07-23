// Released under the MIT License - https://github.com/jriecken/sat-js

//
// ## Vector
//
// Represents a vector in two dimensions with `x` and `y` properties.

// Create a new Vector, optionally passing in the `x` and `y` coordinates. If
// a coordinate is not specified, it will be set to `0`
class Vector {
  /**
   * @param {?number=} x The x position.
   * @param {?number=} y The y position.
   * @constructor
   */
  constructor(x, y) {
    this.x = x || 0;
    this.y = y || 0;
  }

  // Copy the values of another Vector into this one.
  /**
   * @param {Vector} other The other Vector.
   * @return {Vector} This for chaining.
   */
  copy(other) {
    this.x = other.x;
    this.y = other.y;
    return this;
  }

  // Create a new vector with the same coordinates as this on.
  /**
   * @return {Vector} The new cloned vector
   */
  clone() {
    return new Vector(this.x, this.y);
  }

  // Change this vector to be perpendicular to what it was before. (Effectively
  // roatates it 90 degrees in a clockwise direction)
  /**
   * @return {Vector} This for chaining.
   */
  perp() {
    var x = this.x;
    this.x = this.y;
    this.y = -x;
    return this;
  }

  // Rotate this vector (counter-clockwise) by the specified angle (in radians).
  /**
   * @param {number} angle The angle to rotate (in radians)
   * @return {Vector} This for chaining.
   */
  rotate(angle) {
    var x = this.x;
    var y = this.y;
    this.x = x * Math.cos(angle) - y * Math.sin(angle);
    this.y = x * Math.sin(angle) + y * Math.cos(angle);
    return this;
  }

  // Reverse this vector.
  /**
   * @return {Vector} This for chaining.
   */
  reverse() {
    this.x = -this.x;
    this.y = -this.y;
    return this;
  }

  // Normalize this vector.  (make it have length of `1`)
  /**
   * @return {Vector} This for chaining.
   */
  normalize() {
    var d = this.len();
    if (d > 0) {
      this.x = this.x / d;
      this.y = this.y / d;
    }
    return this;
  }

  // Add another vector to this one.
  /**
   * @param {Vector} other The other Vector.
   * @return {Vector} This for chaining.
   */
  add(other) {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  // Subtract another vector from this one.
  /**
   * @param {Vector} other The other Vector.
   * @return {Vector} This for chaiing.
   */
  sub(other) {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  // Scale this vector. An independent scaling factor can be provided
  // for each axis, or a single scaling factor that will scale both `x` and `y`.
  /**
   * @param {number} x The scaling factor in the x direction.
   * @param {?number=} y The scaling factor in the y direction.  If this
   *   is not specified, the x scaling factor will be used.
   * @return {Vector} This for chaining.
   */
  scale(x, y) {
    this.x *= x;
    this.y *= typeof y != 'undefined' ? y : x;
    return this;
  }

  // Project this vector on to another vector.
  /**
   * @param {Vector} other The vector to project onto.
   * @return {Vector} This for chaining.
   */
  project(other) {
    var amt = this.dot(other) / other.len2();
    this.x = amt * other.x;
    this.y = amt * other.y;
    return this;
  }

  // Project this vector onto a vector of unit length. This is slightly more efficient
  // than `project` when dealing with unit vectors.
  /**
   * @param {Vector} other The unit vector to project onto.
   * @return {Vector} This for chaining.
   */
  projectN(other) {
    var amt = this.dot(other);
    this.x = amt * other.x;
    this.y = amt * other.y;
    return this;
  }

  // Reflect this vector on an arbitrary axis.
  /**
   * @param {Vector} axis The vector representing the axis.
   * @return {Vector} This for chaining.
   */
  reflect(axis) {
    var x = this.x;
    var y = this.y;
    this.project(axis).scale(2);
    this.x -= x;
    this.y -= y;
    return this;
  }

  // Reflect this vector on an arbitrary axis (represented by a unit vector). This is
  // slightly more efficient than `reflect` when dealing with an axis that is a unit vector.
  /**
   * @param {Vector} axis The unit vector representing the axis.
   * @return {Vector} This for chaining.
   */
  reflectN(axis) {
    var x = this.x;
    var y = this.y;
    this.projectN(axis).scale(2);
    this.x -= x;
    this.y -= y;
    return this;
  }

  // Get the dot product of this vector and another.
  /**
   * @param {Vector}  other The vector to dot this one against.
   * @return {number} The dot product.
   */
  dot(other) {
    return this.x * other.x + this.y * other.y;
  }

  // Get the squared length of this vector.
  /**
   * @return {number} The length^2 of this vector.
   */
  len2() {
    return this.dot(this);
  }

  // Get the length of this vector.
  /**
   * @return {number} The length of this vector.
   */
  len() {
    return Math.sqrt(this.len2());
  }
}

// ## Polygon
//
// Represents a *convex* polygon with any number of points (specified in counter-clockwise order)
//
// Note: Do _not_ manually change the `points`, `angle`, or `offset` properties. Use the
// provided setters. Otherwise the calculated properties will not be updated correctly.
//
// `pos` can be changed directly.

class Polygon {
  // Create a new polygon, passing in a position vector, and an array of points (represented
  // by vectors relative to the position vector). If no position is passed in, the position
  // of the polygon will be `(0,0)`.
  /**
   * @param {Vector=} pos A vector representing the origin of the polygon. (all other
   *   points are relative to this one)
   * @param {Array<Vector>=} points An array of vectors representing the points in the polygon,
   *   in counter-clockwise order.
   * @constructor
   */
  constructor(pos, points) {
    this.pos = pos || new Vector();
    this.angle = 0;
    this.offset = new Vector();
    this.setPoints(points || []);
  }

  // Set the points of the polygon.
  //
  // Note: The points are counter-clockwise *with respect to the coordinate system*.
  // If you directly draw the points on a screen that has the origin at the top-left corner
  // it will _appear_ visually that the points are being specified clockwise. This is just
  // because of the inversion of the Y-axis when being displayed.
  /**
   * @param {Array<Vector>=} points An array of vectors representing the points in the polygon,
   *   in counter-clockwise order.
   * @return {Polygon} This for chaining.
   */
  setPoints(points) {
    // Only re-allocate if this is a new polygon or the number of points has changed.
    var lengthChanged = !this.points || this.points.length !== points.length;
    if (lengthChanged) {
      var i;
      var calcPoints = (this.calcPoints = []);
      var edges = (this.edges = []);
      var normals = (this.normals = []);
      // Allocate the vector arrays for the calculated properties
      for (i = 0; i < points.length; i++) {
        calcPoints.push(new Vector());
        edges.push(new Vector());
        normals.push(new Vector());
      }
    }
    this.points = points;
    this._recalc();
    return this;
  }

  // Set the current rotation angle of the polygon.
  /**
   * @param {number} angle The current rotation angle (in radians).
   * @return {Polygon} This for chaining.
   */
  setAngle(angle) {
    this.angle = angle;
    this._recalc();
    return this;
  }

  // Set the current offset to apply to the `points` before applying the `angle` rotation.
  /**
   * @param {Vector} offset The new offset vector.
   * @return {Polygon} This for chaining.
   */
  setOffset(offset) {
    this.offset = offset;
    this._recalc();
    return this;
  }

  // Rotates this polygon counter-clockwise around the origin of *its local coordinate system* (i.e. `pos`).
  //
  // Note: This changes the **original** points (so any `angle` will be applied on top of this rotation).
  /**
   * @param {number} angle The angle to rotate (in radians)
   * @return {Polygon} This for chaining.
   */
  rotate(angle) {
    var points = this.points;
    var len = points.length;
    for (var i = 0; i < len; i++) {
      points[i].rotate(angle);
    }
    this._recalc();
    return this;
  }

  // Translates the points of this polygon by a specified amount relative to the origin of *its own coordinate
  // system* (i.e. `pos`).
  //
  // This is most useful to change the "center point" of a polygon. If you just want to move the whole polygon, change
  // the coordinates of `pos`.
  //
  // Note: This changes the **original** points (so any `offset` will be applied on top of this translation)
  /**
   * @param {number} x The horizontal amount to translate.
   * @param {number} y The vertical amount to translate.
   * @return {Polygon} This for chaining.
   */
  translate(x, y) {
    var points = this.points;
    var len = points.length;
    for (var i = 0; i < len; i++) {
      points[i].x += x;
      points[i].y += y;
    }
    this._recalc();
    return this;
  }

  // Computes the calculated collision polygon. Applies the `angle` and `offset` to the original points then recalculates the
  // edges and normals of the collision polygon.
  /**
   * @return {Polygon} This for chaining.
   */
  // - this is what is used for underlying collisions and takes into account
  _recalc() {
    // the angle/offset set on the polygon.
    var calcPoints = this.calcPoints;
    // The edges here are the direction of the `n`th edge of the polygon, relative to
    // the `n`th point. If you want to draw a given edge from the edge value, you must
    // first translate to the position of the starting point.
    var edges = this.edges;
    // The normals here are the direction of the normal for the `n`th edge of the polygon, relative
    // to the position of the `n`th point. If you want to draw an edge normal, you must first
    // translate to the position of the starting point.
    var normals = this.normals;
    // Copy the original points array and apply the offset/angle
    var points = this.points;
    var offset = this.offset;
    var angle = this.angle;
    var len = points.length;
    var i;
    for (i = 0; i < len; i++) {
      var calcPoint = calcPoints[i].copy(points[i]);
      calcPoint.x += offset.x;
      calcPoint.y += offset.y;
      if (angle !== 0) {
        calcPoint.rotate(angle);
      }
    }
    // Calculate the edges/normals
    for (i = 0; i < len; i++) {
      var p1 = calcPoints[i];
      var p2 = i < len - 1 ? calcPoints[i + 1] : calcPoints[0];
      var e = edges[i].copy(p2).sub(p1);
      normals[i].copy(e).perp().normalize();
    }
    return this;
  }

  // Compute the axis-aligned bounding box. Any current state
  // (translations/rotations) will be applied before constructing the AABB.
  //
  // Note: Returns a _new_ `Polygon` each time you call this.
  /**
   * @return {Polygon} The AABB
   */
  getAABB() {
    var points = this.calcPoints;
    var len = points.length;
    var xMin = points[0].x;
    var yMin = points[0].y;
    var xMax = points[0].x;
    var yMax = points[0].y;
    for (var i = 1; i < len; i++) {
      var point = points[i];
      if (point.x < xMin) {
        xMin = point.x;
      } else if (point.x > xMax) {
        xMax = point.x;
      }
      if (point.y < yMin) {
        yMin = point.y;
      } else if (point.y > yMax) {
        yMax = point.y;
      }
    }
    return new Box(
      this.pos.clone().add(new Vector(xMin, yMin)),
      xMax - xMin,
      yMax - yMin
    ).toPolygon();
  }

  // Compute the centroid (geometric center) of the polygon. Any current state
  // (translations/rotations) will be applied before computing the centroid.
  //
  // See https://en.wikipedia.org/wiki/Centroid#Centroid_of_a_polygon
  //
  // Note: Returns a _new_ `Vector` each time you call this.
  /**
   * @return {Vector} A Vector that contains the coordinates of the Centroid.
   */
  getCentroid() {
    var points = this.calcPoints;
    var len = points.length;
    var cx = 0;
    var cy = 0;
    var ar = 0;
    for (var i = 0; i < len; i++) {
      var p1 = points[i];
      var p2 = i === len - 1 ? points[0] : points[i + 1]; // Loop around if last point
      var a = p1.x * p2.y - p2.x * p1.y;
      cx += (p1.x + p2.x) * a;
      cy += (p1.y + p2.y) * a;
      ar += a;
    }
    ar = ar * 3; // we want 1 / 6 the area and we currently have 2*area
    cx = cx / ar;
    cy = cy / ar;
    return new Vector(cx, cy);
  }
}
// ## Box
//
// Represents an axis-aligned box, with a width and height.

// Create a new box, with the specified position, width, and height. If no position
// is given, the position will be `(0,0)`. If no width or height are given, they will
// be set to `0`.
class Box {
  /**
   * @param {Vector=} pos A vector representing the bottom-left of the box (i.e. the smallest x and smallest y value).
   * @param {?number=} w The width of the box.
   * @param {?number=} h The height of the box.
   * @constructor
   */
  constructor(pos, w, h) {
    this.pos = pos || new Vector();
    this.w = w || 0;
    this.h = h || 0;
  }

  // Returns a polygon whose edges are the same as this box.
  /**
   * @return {Polygon} A new Polygon that represents this box.
   */
  toPolygon() {
    var pos = this.pos;
    var w = this.w;
    var h = this.h;
    return new Polygon(new Vector(pos.x, pos.y), [
      new Vector(),
      new Vector(w, 0),
      new Vector(w, h),
      new Vector(0, h),
    ]);
  }
}
class SAT {
  // ## Object Pools
  constructor() {
    // A pool of `Vector` objects that are used in calculations to avoid
    // allocating memory.
    /**
     * @type {Array<Vector>}
     */
    this.T_VECTORS = [];
    for (let i = 0; i < 10; i++) {
      this.T_VECTORS.push(new Vector());
    }

    // A pool of arrays of numbers used in calculations to avoid allocating
    // memory.
    /**
     * @type {Array<Array<number>>}
     */
    this.T_ARRAYS = [];
    for (let i = 0; i < 5; i++) {
      this.T_ARRAYS.push([]);
    }

    // Temporary response used for polygon hit detection.
    /**
     * @type {Response}
     */
    this.T_RESPONSE = new Response();

    // Tiny "point" polygon used for polygon hit detection.
    /**
     * @type {Polygon}
     */
    this.TEST_POINT = new Box(new Vector(), 0.000001, 0.000001).toPolygon();
    // Constants for Voronoi regions
    /**
     * @const
     */
    this.LEFT_VORONOI_REGION = -1;
    /**
     * @const
     */
    this.MIDDLE_VORONOI_REGION = 0;
    /**
     * @const
     */
    this.RIGHT_VORONOI_REGION = 1;
  }
  // ## Helper Functions

  // Flattens the specified array of points onto a unit vector axis,
  // resulting in a one dimensional range of the minimum and
  // maximum value on that axis.
  /**
   * @param {Array<Vector>} points The points to flatten.
   * @param {Vector} normal The unit vector axis to flatten on.
   * @param {Array<number>} result An array.  After calling this function,
   *   result[0] will be the minimum value,
   *   result[1] will be the maximum value.
   */
  flattenPointsOn(points, normal, result) {
    var min = Number.MAX_VALUE;
    var max = -Number.MAX_VALUE;
    var len = points.length;
    for (var i = 0; i < len; i++) {
      // The magnitude of the projection of the point onto the normal
      var dot = points[i].dot(normal);
      if (dot < min) {
        min = dot;
      }
      if (dot > max) {
        max = dot;
      }
    }
    result[0] = min;
    result[1] = max;
  }

  // Check whether two convex polygons are separated by the specified
  // axis (must be a unit vector).
  /**
   * @param {Vector} aPos The position of the first polygon.
   * @param {Vector} bPos The position of the second polygon.
   * @param {Array<Vector>} aPoints The points in the first polygon.
   * @param {Array<Vector>} bPoints The points in the second polygon.
   * @param {Vector} axis The axis (unit sized) to test against.  The points of both polygons
   *   will be projected onto this axis.
   * @return {boolean} true if it is a separating axis, false otherwise.  If false,
   *   and a response is passed in, information about how much overlap and
   *   the direction of the overlap will be populated.
   */
  isSeparatingAxis(aPos, bPos, aPoints, bPoints, axis, response) {
    var rangeA = this.T_ARRAYS.pop();
    var rangeB = this.T_ARRAYS.pop();
    // The magnitude of the offset between the two polygons
    var offsetV = this.T_VECTORS.pop().copy(bPos).sub(aPos);
    var projectedOffset = offsetV.dot(axis);
    // Project the polygons onto the axis.
    this.flattenPointsOn(aPoints, axis, rangeA);
    this.flattenPointsOn(bPoints, axis, rangeB);
    // Move B's range to its position relative to A.
    rangeB[0] += projectedOffset;
    rangeB[1] += projectedOffset;
    // Check if there is a gap. If there is, this is a separating axis and we can stop
    if (rangeA[0] > rangeB[1] || rangeB[0] > rangeA[1]) {
      this.T_VECTORS.push(offsetV);
      this.T_ARRAYS.push(rangeA);
      this.T_ARRAYS.push(rangeB);
      return true;
    }
    // This is not a separating axis. If we're calculating a response, calculate the overlap.
    if (response) {
      var overlap = 0;
      // A starts further left than B
      if (rangeA[0] < rangeB[0]) {
        response.aInB = false;
        // A ends before B does. We have to pull A out of B
        if (rangeA[1] < rangeB[1]) {
          overlap = rangeA[1] - rangeB[0];
          response.bInA = false;
          // B is fully inside A.  Pick the shortest way out.
        } else {
          let option1 = rangeA[1] - rangeB[0];
          let option2 = rangeB[1] - rangeA[0];
          overlap = option1 < option2 ? option1 : -option2;
        }
        // B starts further left than A
      } else {
        response.bInA = false;
        // B ends before A ends. We have to push A out of B
        if (rangeA[1] > rangeB[1]) {
          overlap = rangeA[0] - rangeB[1];
          response.aInB = false;
          // A is fully inside B.  Pick the shortest way out.
        } else {
          let option1 = rangeA[1] - rangeB[0];
          let option2 = rangeB[1] - rangeA[0];
          overlap = option1 < option2 ? option1 : -option2;
        }
      }
      // If this is the smallest amount of overlap we've seen so far, set it as the minimum overlap.
      var absOverlap = Math.abs(overlap);
      if (absOverlap < response.overlap) {
        response.overlap = absOverlap;
        response.overlapN.copy(axis);
        if (overlap < 0) {
          response.overlapN.reverse();
        }
      }
    }
    this.T_VECTORS.push(offsetV);
    this.T_ARRAYS.push(rangeA);
    this.T_ARRAYS.push(rangeB);
    return false;
  }

  // Calculates which Voronoi region a point is on a line segment.
  // It is assumed that both the line and the point are relative to `(0,0)`
  //
  //            |       (0)      |
  //     (-1)  [S]--------------[E]  (1)
  //            |       (0)      |
  /**
   * @param {Vector} line The line segment.
   * @param {Vector} point The point.
   * @return  {number} this.LEFT_VORONOI_REGION (-1) if it is the left region,
   *          this.MIDDLE_VORONOI_REGION (0) if it is the middle region,
   *          this.RIGHT_VORONOI_REGION (1) if it is the right region.
   */
  voronoiRegion(line, point) {
    var len2 = line.len2();
    var dp = point.dot(line);
    // If the point is beyond the start of the line, it is in the
    // left voronoi region.
    if (dp < 0) {
      return this.LEFT_VORONOI_REGION;
    }
    // If the point is beyond the end of the line, it is in the
    // right voronoi region.
    else if (dp > len2) {
      return this.RIGHT_VORONOI_REGION;
    }
    // Otherwise, it's in the middle one.
    else {
      return this.MIDDLE_VORONOI_REGION;
    }
  }

  // ## Collision Tests

  // Check if a point is inside a convex polygon.
  /**
   * @param {Vector} p The point to test.
   * @param {Polygon} poly The polygon to test.
   * @return {boolean} true if the point is inside the polygon, false if it is not.
   */
  pointInPolygon(p, poly) {
    this.TEST_POINT.pos.copy(p);
    this.T_RESPONSE.clear();
    var result = this.testPolygonPolygon(
      this.TEST_POINT,
      poly,
      this.T_RESPONSE
    );
    if (result) {
      result = this.T_RESPONSE.aInB;
    }
    return result;
  }

  // Checks whether polygons collide.
  /**
   * @param {Polygon} a The first polygon.
   * @param {Polygon} b The second polygon.
   *   they interset.
   * @return {boolean} true if they intersect, false if they don't.
   */
  testPolygonPolygon(a, b, response) {
    var aPoints = a.calcPoints;
    var aLen = aPoints.length;
    var bPoints = b.calcPoints;
    var bLen = bPoints.length;
    // If any of the edge normals of A is a separating axis, no intersection.
    for (let i = 0; i < aLen; i++) {
      if (
        this.isSeparatingAxis(
          a.pos,
          b.pos,
          aPoints,
          bPoints,
          a.normals[i],
          response
        )
      ) {
        return false;
      }
    }
    // If any of the edge normals of B is a separating axis, no intersection.
    for (let i = 0; i < bLen; i++) {
      if (
        this.isSeparatingAxis(
          a.pos,
          b.pos,
          aPoints,
          bPoints,
          b.normals[i],
          response
        )
      ) {
        return false;
      }
    }
    // Since none of the edge normals of A or B are a separating axis, there is an intersection
    // and we've already calculated the smallest overlap (in isSeparatingAxis).  Calculate the
    // final overlap vector.
    if (response) {
      response.a = a;
      response.b = b;
      response.overlapV.copy(response.overlapN).scale(response.overlap);
    }
    return true;
  }
}

// ## Response
//
// An object representing the result of an intersection. Contains:
//  - The two objects participating in the intersection
//  - The vector representing the minimum change necessary to extract the first object
//    from the second one (as well as a unit vector in that direction and the magnitude
//    of the overlap)
//  - Whether the first object is entirely inside the second, and vice versa.
/**
 * @constructor
 */
class Response {
  constructor() {
    this.a = null;
    this.b = null;
    this.overlapN = new Vector();
    this.overlapV = new Vector();
    this.clear();
  }

  // Set some values of the response back to their defaults.  Call this between tests if
  // you are going to reuse a single Response object for multiple intersection tests (recommented
  // as it will avoid allcating extra memory)
  /**
   * @return {Response} This for chaining
   */
  clear() {
    this.aInB = true;
    this.bInA = true;
    this.overlap = Number.MAX_VALUE;
    return this;
  }
}
export { SAT, Box, Vector, Response, Polygon };
