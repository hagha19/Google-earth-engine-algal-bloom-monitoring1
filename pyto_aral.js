/**** Start of imports. If edited, may not auto-convert in the playground1. ****/
var L5 = ee.ImageCollection("LANDSAT/LM05/C01/T2"),
    poly2 = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[57.72255683968113, 47.40896611132533],
          [57.72255683968113, 43.92502233765318],
          [61.99623848030613, 43.92502233765318],
          [61.99623848030613, 47.40896611132533]]], null, false),
    imageCollection1 = ee.ImageCollection("LANDSAT/LT05/C01/T1_TOA"),
    poly = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[57.92105175940124, 44.26014025376266],
          [58.40445019690124, 43.97620383919316],
          [60.38198925940124, 43.928748460110064],
          [60.97525097815124, 44.88622401754678],
          [61.41470410315124, 46.73909794223547],
          [60.00845410315124, 46.874452655927506],
          [59.10757519690124, 46.31581555807899],
          [58.42642285315124, 45.79739365630909],
          [57.94302441565124, 44.71472292255743]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var Clipimage = function(image) {
    return ee.Image(image.clip(poly2)).set('system:time_start', image.get('system:time_start'));
};



var Bloom = function(img1) {
  var H1 = (img1.select('B2_median').subtract(img1.select('B1_median'))).divide(img1.select('B3_median').add(img1.select('B2_median')).subtract(img1.select('B1_median').multiply(2)));
  var H2 = (img1.select('B3_median').subtract(img1.select('B1_median'))).divide(img1.select('B3_median').add(img1.select('B1_median')).subtract(img1.select('B2_median').multiply(2))).add(2);
  var H3 = (img1.select('B1_median').subtract(img1.select('B3_median'))).divide(img1.select('B2_median').add(img1.select('B1_median')).subtract(img1.select('B3_median').multiply(2))).add(1);
  var H = ((img1.select('B1_median').gt(img1.select('B2_median')).and(img1.select('B1_median').gt(img1.select('B3_median'))).multiply(H1)).add(
  img1.select('B2_median').gt(img1.select('B1_median')).and(img1.select('B2_median').gt(img1.select('B3_median'))).multiply(H2))).add(
    img1.select('B3_median').gt(img1.select('B2_median')).and(img1.select('B3_median').gt(img1.select('B1_median'))).multiply(H3));
  var F = H.gt(1.6);
  
  return F.multiply( img1.select('B4_median').subtract(img1.select('B5_median').multiply(1.03))).copyProperties(img1, ['system:time_start']);
};

var watermask = function(image) {
  var AWEI1 = (image.select('B2_median').subtract(image.select('B5_median'))).multiply(4);
  var AWEI2 = (image.select('B4_median').multiply(0.25)).add(image.select('B7_median').multiply(2.75));
  var AWEI = AWEI1.subtract(AWEI2);
  return AWEI.gt(0).copyProperties(image, ['system:time_start']);
};

var bloomdegree = function(image) {
  var AWEI1 = (image.select('B2_median').subtract(image.select('B5_median'))).multiply(4);
  var AWEI2 = (image.select('B4_median').multiply(0.25)).add(image.select('B7_median').multiply(2.75));
  var AWEI = AWEI1.subtract(AWEI2);
  var H1 = (image.select('B2_median').subtract(image.select('B1_median'))).divide(image.select('B3_median').add(image.select('B2_median')).subtract(image.select('B1_median').multiply(2)));
  var H2 = (image.select('B3_median').subtract(image.select('B1_median'))).divide(image.select('B3_median').add(image.select('B1_median')).subtract(image.select('B2_median').multiply(2))).add(2);
  var H3 = (image.select('B1_median').subtract(image.select('B3_median'))).divide(image.select('B2_median').add(image.select('B1_median')).subtract(image.select('B3_median').multiply(2))).add(1);
  var H = ((image.select('B1_median').gt(image.select('B2_median')).and(image.select('B1_median').gt(image.select('B3_median'))).multiply(H1)).add(
  image.select('B2_median').gt(image.select('B1_median')).and(image.select('B2_median').gt(image.select('B3_median'))).multiply(H2))).add(
    image.select('B3_median').gt(image.select('B2_median')).and(image.select('B3_median').gt(image.select('B1_median'))).multiply(H3));
  var W = AWEI.gt(0);
  var F = H.gt(1.6);  
  var b = F.multiply( image.select('B4_median').subtract(image.select('B5_median').multiply(1.03)));
  var img = b.multiply(W);

  return img.copyProperties(image, ['system:time_start']);

};

var mean_area = function(wmask){
    var Area = wmask.float().reduceRegion({reducer: ee.Reducer.sum(),geometry: wmask.geometry(),scale: 30,
      maxPixels: 1e13
    });
    return Area;
};

var doyList = ee.List.sequence(1985, 2012);

var ndviCol =  ee.ImageCollection("LANDSAT/LT05/C01/T1_TOA");
// Map over the list of days to build a list of image composites.
var ndviCompList = doyList.map(function(starty) {
  // Ensure that startDoy is a number.
  starty = ee.Number(starty);

  // Filter images by date range; starting with the current startDate and
  // ending 15 days later. Reduce the resulting image collection by median.
  return ndviCol
    .filter(ee.Filter.calendarRange(starty, starty.add(1), 'year'))
    .reduce(ee.Reducer.median()).copyProperties(ndviCol
    .filter(ee.Filter.calendarRange(starty, starty.add(1), 'year')).first(), ['system:time_start']);
});
print(ndviCompList);
// Convert the image List to an ImageCollection.
var ndviCompCol = ee.ImageCollection.fromImages(ndviCompList).set('system:time_start', ndviCol.get('system:time_start'));
var clipped = ndviCompCol.map(Clipimage);
print('clipped', clipped);

var bloom = clipped.map(Bloom);
var wmask = clipped.map(watermask);
var Bmean = clipped.map(bloomdegree);
print('bloom' , bloom);
print('wmask',wmask);
Map.addLayer(clipped.select(0));
Map.addLayer(wmask.select(0));
Map.addLayer(Bmean.select(0) ,{palette: ['000000','00FF00','0000FF']});


// var chartArea = ui.Chart.image.series(wmask, poly2, ee.Reducer.sum(), 1000,'system:time_start' );
// print(chartArea);
// var chartBloom = ui.Chart.image.series(Bmean, poly2, ee.Reducer.mean(), 1000 ,'system:time_start');
// print(chartBloom);
//var batch = require('users/fitoprincipe/geetools:batch');
//batch.Download.ImageCollection.toDrive(wmask, "wmask", {scale:30});
//batch.Download.ImageCollection.toDrive(Bmean, "Bmean", {scale:30});