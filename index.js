/*
 * fis
 * http://fis.baidu.com/
 */

'use strict';

function clearDomain(url){
    return url.replace(/^HTTP:\/\/DEV\//,'');
}

function mergePath(filePath, resPath){
    var filePathGroup = filePath.match(/[^\/]*\//g);
    var resPath = resPath.replace(/^HTTP:\/\/DEV/,'').match(/[^\/]*\/|[^\/]+$/g);
    var retPath = resPath.concat();
    resPath.forEach(function(item, index){
        if(filePathGroup[index] === item){
            retPath[index] = ''
        }else if(filePathGroup[index] && filePathGroup[index] != item){
            retPath.unshift('../')
        }
    })
    return retPath.join('');
}

module.exports = function(ret, settings, conf, opt){ //打包后处理
    var map = {
        res : {},
        pkg : {}
    };
    fis.util.map(ret.map.res, function(id, res){
        var r = map.res[id] = {};
        if(res.deps) r.deps = res.deps;
        //有打包的话就不要加url了，以减少map.js的体积
        if(res.pkg) {
            r.pkg = res.pkg;
        } else {
            r.url = clearDomain(res.uri);
        }
    });
    fis.util.map(ret.map.pkg, function(id, res){
        var r = map.pkg[id] = {};
        r.url = clearDomain(res.uri);
        if(res.deps) r.deps = res.deps;
    });
    var code = 'require.resourceMap(' + JSON.stringify(map, null, opt.optimize ? null : 4) + ');';
    //构造map.js配置文件
    var subpath = (conf.subpath || 'pkg/map.js').replace(/^\//, '');
    var file = fis.file(fis.project.getProjectPath(), subpath);
    file.setContent(code);
    ret.pkg[file.subpath] = file;

    var mapJs = file.getUrl(opt.hash);

    var script = '<script src="' + file.getUrl(opt.hash, opt.domain) + '"></script>';


    fis.util.map(ret.src, function(subpath, file){

        if(file.isHtmlLike || file.isJsLike || file.isCssLike){

            var content = file.getContent();
            var release = file.release;

            if(file.url.indexOf('html')>-1){
                //console.log(file.url, file.noMapJs)
            }

            if(content && content.replace && file.isHtmlLike && file.noMapJs !== false){ //类html文件
                console.log(file.url, file.noMapJs);
                var script = '<script src="' + mergePath(file.release, mapJs)  + '"></script>';
                content = content.replace(/<\/head>/, script + '\n$&');
                file.setContent(content);
            }

            /*
            if(content){
                content = content.replace(/HTTP:\/\/[^'")]+/g, function($all){

                    var path =  $all.replace(/^HTTP:\/\/DEV/,'');
                    if(/\.js$/.test(file.basename)){
                        return path;
                    }
                    try{
                        path = path.replace(/^\//,'').replace(/\.css$/,'.less');
                        //console.log(ret.map.res[path.replace(/^\//,'')],$all)
                        //console.log(release)
                        var uri = ret.map.res[path].uri;
                        //console.log(release,ret.map.res[id].uri, $all)
                        return mergePath(release, uri);
                    }catch(e){}
                    return mergePath(release, $all)
                });
                file.setContent(content);
            }
            */
        }
    });
};
