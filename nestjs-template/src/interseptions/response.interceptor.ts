import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IResponseInterceptor } from 'src/typings/interceptor';


@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((returns: IResponseInterceptor) => {
                const message = returns?.message || 'Success';
                delete returns.message
                const data = returns?.data || null
                delete returns.data

                return {
                    message,
                    data,
                    ...returns,
                    timestamp: new Date().toISOString(),
                };
            }),
        );
    }
}