/**
 * @description 即时消息通讯
 * @author 张建利
 * @version 1.0
 * @time 2017-8-11 16:58:53
 */
function socket()
{
    //服务地址
    var server = "";
    //websocket对象
    var ws = null;
    //响应函数
    var respons = null;

    //防闭包指针
    var _this = this;

    /**
    * @description 检测是否支持
    * @return {bool}
    */
    this.isSupport = function ()
    {
        return !! "WebSocket" in window;
    }

    /**
    * @description 初始化
    * @param {string} url 服务器地址(必须带用户)
    * @param {function} fn 接受消息后执行的函数
    * @return {void}
    */
    this.init = function ( url, fn )
    {
        server = url;
        var wsImpl = window.WebSocket || window.MozWebSocket;
        ws = new wsImpl( "ws://" + server );
        respons = fn;

        ws.onopen = function ()
        {

        };

        //接收数据
        ws.onmessage = function ( evt )
        {
            respons( evt.data );
        };

        //被终端
        ws.onclose = function ()
        {
            //服务端断开后客户端自动重连
            _this.init( server, respons );
        };
    }

    /**
    * @description 发送消息
    * @param {string} message 要发送的消息
    * @return {void}
    */
    this.send = function ( message )
    {
        //正在连接
        if ( ws.readyState != "1" )
        {
            return ws.readyState;
        }
        ws.send( message );
    }
}